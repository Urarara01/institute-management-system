#!/usr/bin/env bash
set -euo pipefail

PROJECT_DOMAIN="portal.urarara.online"
DEPLOY_DIR="/opt/portal-urarara"
BACKEND_DIR="$DEPLOY_DIR/backend"
FRONTEND_DIR="$DEPLOY_DIR/frontend"
SERVICE_NAME="portal-urarara-backend"
NGINX_CONF="/etc/nginx/sites-available/$PROJECT_DOMAIN.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/$PROJECT_DOMAIN.conf"
DJANGO_PORT=8800
PYTHON_BIN="python3"
VENV_DIR="$BACKEND_DIR/.venv"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Este script debe ejecutarse con sudo o como root."
  exit 1
fi

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "python3 no está disponible. Instala Python 3.12+ en el servidor."
  exit 1
fi

if ! command -v nginx >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    echo "Instalando Nginx..."
    apt-get update
    apt-get install -y nginx
  else
    echo "Nginx no encontrado y no se detecta apt-get. Instala nginx manualmente."
    exit 1
  fi
fi

if ! command -v rsync >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    apt-get install -y rsync
  else
    echo "rsync no está instalado. Instálalo antes de ejecutar este script."
    exit 1
  fi
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "$DEPLOY_DIR"
rsync -a --delete --exclude '.git' --exclude 'deploy' --exclude '__pycache__' --exclude '*.pyc' --exclude 'backend/.venv' "$PROJECT_ROOT/" "$DEPLOY_DIR/"

cd "$BACKEND_DIR"

if [[ -d "$VENV_DIR" && ! -f "$VENV_DIR/bin/activate" ]]; then
  rm -rf "$VENV_DIR"
fi

if [[ ! -d "$VENV_DIR" ]]; then
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"
python -m pip install --upgrade pip setuptools wheel uv

if [[ ! -f "$BACKEND_DIR/db.sqlite3" ]]; then
  echo "Advertencia: No se encontró db.sqlite3 en el backend. Asegúrate de copiar la base de datos si es necesaria."
fi

echo "Ejecutando uv sync..."
printf 'y\n' | python -m uv sync

echo "Ejecutando migraciones y collectstatic..."
python manage.py migrate --noinput
python manage.py collectstatic --noinput

RUN_USER=www-data
RUN_GROUP=www-data
if ! id -u "$RUN_USER" >/dev/null 2>&1; then
  RUN_USER="${SUDO_USER:-root}"
fi
if ! getent group "$RUN_GROUP" >/dev/null 2>&1; then
  RUN_GROUP="$(id -gn "$RUN_USER")"
fi

cat > "/etc/systemd/system/$SERVICE_NAME.service" <<EOF
[Unit]
Description=Django backend for portal.urarara.online
After=network.target

[Service]
Type=simple
User=$RUN_USER
Group=$RUN_GROUP
WorkingDirectory=$BACKEND_DIR
Environment="DJANGO_SETTINGS_MODULE=core.settings"
Environment="DJANGO_DEBUG=False"
Environment="DJANGO_ALLOWED_HOSTS=$PROJECT_DOMAIN"
ExecStart=$VENV_DIR/bin/python -m uvicorn core.asgi:application --host 127.0.0.1 --port $DJANGO_PORT --workers 4 --proxy-headers
Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

chown -R "$RUN_USER":"$RUN_GROUP" "$DEPLOY_DIR" || true

cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $PROJECT_DOMAIN;

    root $FRONTEND_DIR;
    index index.html;

    location /static/ {
        alias $BACKEND_DIR/staticfiles/;
        access_log off;
        expires 30d;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:$DJANGO_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:$DJANGO_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(?:css|js|jpg|jpeg|png|gif|ico|svg|woff2?|ttf|eot)$ {
        expires 30d;
        access_log off;
    }
}
EOF

ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME"

nginx -t
systemctl restart nginx

echo "Despliegue completado en $PROJECT_DOMAIN. Backend escuchando en localhost:$DJANGO_PORT y frontend servido desde $FRONTEND_DIR."
