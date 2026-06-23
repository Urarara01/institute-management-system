# Manual de Instalación y Despliegue | EDU+ Corp

Este manual detalla los pasos para configurar el sistema tanto en un entorno de desarrollo local como en un servidor de producción utilizando el script de despliegue automatizado.

---

## 🏗️ Configuración en Desarrollo (Local)

### 1. Requisitos Previos
-   **Python 3.12+**
-   **uv** (recomendado) o **pip**

### 2. Instalación del Backend
Navegue a la carpeta `backend/` y configure el entorno:

**Usando uv:**
```bash
uv sync
```

**Usando pip:**
```bash
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
pip install django djangorestframework django-cors-headers djangorestframework-simplejwt uvicorn[standard]
```

### 3. Base de Datos y Superusuario
```bash
python manage.py migrate
python manage.py createsuperuser
```

### 4. Ejecución
Para desarrollo local, puede usar el servidor de Django:
```bash
python manage.py runserver
```
El sistema utiliza el puerto **8800** en producción, pero en local puede usar el por defecto (8000).

---

## 🚀 Despliegue en Producción (Linux/Ubuntu)

El proyecto incluye un script de automatización (`deploy/autodeploy.sh`) que configura Nginx, Gunicorn/Uvicorn y Systemd.

### 1. Requisitos del Servidor
-   Sistema operativo basado en Debian/Ubuntu.
-   Acceso root o privilegios de `sudo`.
-   Dominio: `portal.urarara.online` (configurado en el script).

### 2. Ejecución del Auto-Despliegue
Cargue el código en su servidor y ejecute el script desde la raíz del proyecto:
```bash
sudo bash deploy/autodeploy.sh
```

### 3. ¿Qué hace el script automáticamente?
1.  **Instalación de paquetes:** Instala Nginx y rsync si no están presentes.
2.  **Preparación de archivos:** Copia el proyecto a `/opt/portal-urarara`.
3.  **Entorno Python:** Crea un entorno virtual, instala `uv` y sincroniza las dependencias.
4.  **Django:** Ejecuta `migrate` y `collectstatic`.
5.  **Systemd:** Crea un servicio llamado `portal-urarara-backend` que corre Uvicorn en el puerto **8800**.
6.  **Nginx:** Configura un Virtual Host para `portal.urarara.online` que:
    *   Sirve el **Frontend** desde `/opt/portal-urarara/frontend`.
    *   Sirve los archivos estáticos desde `/opt/portal-urarara/backend/staticfiles`.
    *   Redirige el tráfico de API y Admin al backend.

### 4. Verificación de Servicios
```bash
# Verificar estado del backend
sudo systemctl status portal-urarara-backend

# Reiniciar Nginx si es necesario
sudo systemctl restart nginx
```

---

## ⚙️ Parámetros Técnicos Importantes
-   **Puerto del Backend:** 8800
-   **Directorio de Despliegue:** `/opt/portal-urarara`
-   **Dominio Configurado:** `portal.urarara.online`
-   **Tecnología de Servidor de App:** Uvicorn (ASGI) para alta disponibilidad.
