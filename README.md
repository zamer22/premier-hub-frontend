# PremierHub Frontend

Aplicación web del proyecto PremierHub. Construida con React 18, TypeScript y Vite. El código fuente de la aplicación vive dentro del directorio `pagina/`.

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20.x |
| npm | incluido con Node.js 20 |
| Git | cualquier versión reciente |
| Docker | requerido solo para despliegue |

---

## Instalación

1. Clona el repositorio:

   ```bash
   git clone <url-del-repositorio>
   cd premier-hub-frontend
   ```

2. Entra al directorio de la aplicación:

   ```bash
   cd pagina
   ```

3. Instala las dependencias:

   ```bash
   npm install
   ```

---

## Variables de entorno

Dentro de `pagina/`, crea un archivo `.env` y configura las variables necesarias según los valores indicados en el documento **`06_Configuracion_de_seguridad.pdf`**, sección **Frontend**.

> El archivo `.env` está incluido en `.gitignore` y no debe subirse al repositorio.

---

## Ejecución local

Desde el directorio `pagina/`, ejecuta el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

El servidor de Vite recarga automáticamente al guardar cambios en los archivos fuente.

---

## Build de producción

Para generar el bundle optimizado para producción, desde `pagina/`:

```bash
npm run build
```

Este comando ejecuta primero la verificación de tipos de TypeScript (`tsc`) y luego genera los archivos estáticos en `pagina/dist/`.

Para previsualizar localmente el resultado del build antes de desplegarlo:

```bash
npm run preview
```

El preview sirve los archivos de `dist/` en `http://localhost:4173`.

---

## Despliegue

### Despliegue con Docker (manual)

El `Dockerfile` ubicado en `pagina/` construye una imagen multi-stage:
- **Stage 1 (`builder`)**: usa `node:20-alpine` para compilar la aplicación.
- **Stage 2**: usa `nginx:alpine` para servir los archivos estáticos generados en `dist/`.

Para construir la imagen Docker desde la raíz del repositorio, pasa las variables de entorno como `--build-arg` (consulta los valores en **`06_Configuracion_de_seguridad.pdf`**, sección **Frontend**):

```bash
docker build \
  --build-arg VITE_API_URL=<valor> \
  --build-arg VITE_APP_URL=<valor> \
  --build-arg VITE_SUPABASE_URL=<valor> \
  -t premier-pagina:latest ./pagina
```

Para correr el contenedor localmente:

```bash
docker run -p 8080:80 premier-pagina:latest
```

La aplicación quedará accesible en `http://localhost:8080`.

---

### Despliegue automático via GitHub Actions

El repositorio tiene dos pipelines de CI/CD configurados en `.github/workflows/`, uno por ambiente:

#### Producción

- **Archivo**: `.github/workflows/deploy.yml`
- **Trigger**: push a la rama `main`
- **Namespace K3s**: `prod`

#### Pre-producción

- **Archivo**: `.github/workflows/deploy-preprod.yml`
- **Trigger**: push a la rama `preprod`
- **Namespace K3s**: `preprod`

#### Pasos que ejecuta cada pipeline

1. Checkout del código con `actions/checkout@v4`.
2. Construcción de la imagen Docker con `docker build`, inyectando las URLs de cada ambiente como `--build-arg`.
3. Importación de la imagen al runtime de K3s con `k3s ctr images import` (necesario porque el clúster no tiene acceso a un registry externo).
4. Actualización del deployment en el clúster con `kubectl set image`, apuntando al SHA exacto del commit.
5. Verificación del rollout con `kubectl rollout status --timeout=120s`.

> Los pipelines se ejecutan en un runner self-hosted que tiene acceso directo al clúster K3s y `kubectl` configurado.

---

### Kubernetes: Services y exposición de puertos

> **Nota:** Los manifiestos de Kubernetes (Deployments, Services, Namespaces, etc.) viven en un repositorio de infraestructura separado y no forman parte de este repo. Lo que se describe a continuación es únicamente cómo funciona la arquitectura para entender el flujo de despliegue.

Cada ambiente tiene un `Service` de tipo `NodePort` que expone el pod de nginx hacia el exterior del clúster:

- **Producción** (`namespace: prod`) → puerto `30300`
- **Pre-producción** (`namespace: preprod`) → puerto `30301`

El campo `nodePort` expone el servicio directamente en el nodo del clúster, permitiendo que el túnel enrute el tráfico hacia él.

---

### Túnel: exposición pública del clúster

El clúster K3s corre en un servidor sin IP pública directa. Para enrutar el tráfico de internet hacia los NodePorts, se configuró un **túnel** (Cloudflare Tunnel) que actúa como proxy entre el dominio público y el nodo del clúster.

El flujo completo de una petición es el siguiente:

```
Usuario
  │
  ▼
Dominio público (ej. app.zamer-o.com)
  │
  ▼
Cloudflare Tunnel  ←── corre como proceso en el servidor del clúster
  │
  ▼
localhost:30300  (NodePort del nodo K3s)
  │
  ▼
Service "pagina" en namespace "prod"
  │
  ▼
Pod nginx → sirve el bundle de React
```

Para pre-producción el flujo es idéntico pero apunta al puerto `30301` y al namespace `preprod`.

El túnel se configura una sola vez en el servidor y no requiere abrir puertos en el firewall ni tener una IP pública, ya que la conexión la inicia el proceso `cloudflared` hacia los servidores de Cloudflare.

> La configuración del túnel y los manifiestos de Kubernetes se encuentran en el repositorio de infraestructura del proyecto.

---

## Estructura del proyecto

```
premier-hub-frontend/
├── .github/
│   └── workflows/
│       ├── deploy.yml           # Pipeline de producción (rama main)
│       └── deploy-preprod.yml   # Pipeline de pre-producción (rama preprod)
└── pagina/                      # Código fuente de la aplicación
    ├── src/
    │   ├── components/          # Componentes reutilizables
    │   ├── pages/               # Vistas por ruta
    │   ├── layouts/             # Layouts de página
    │   ├── router/              # Configuración de rutas (React Router)
    │   └── main.tsx             # Punto de entrada
    ├── Dockerfile
    ├── nginx.conf               # Configuración de Nginx para producción
    ├── index.html
    ├── tsconfig.json
    └── package.json
```
