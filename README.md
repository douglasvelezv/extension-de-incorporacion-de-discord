# 📋 Discord Onboarding Exporter

> Descarga la configuración de incorporación (onboarding), preguntas de unión y normas de cualquier servidor de Discord directamente desde tu navegador.

![license MIT](https://img.shields.io/badge/license-MIT-blue.svg) ![version 1.0.0](https://img.shields.io/badge/version-1.0.0-green.svg) ![manifest v3](https://img.shields.io/badge/manifest-v3-orange.svg)

## 🚀 Características

### 🏠 Incorporación (Onboarding)
- Exporta el mensaje de bienvenida y descripción del servidor.
- Lista los canales predeterminados configurados.
- Visualiza las tareas de incorporación (checklists) con sus canales asociados.
- Indica si las tareas son requeridas u opcionales.

### ❓ Preguntas de Unión
- Extrae todas las preguntas de selección (única o múltiple).
- Muestra los emojis personalizados de cada opción.
- Identifica los canales y roles asignados a cada respuesta.
- Exporta las imágenes de los emojis de las preguntas.

### 📜 Normas y Configuración
- Detecta el canal de normas (rules) configurado.
- Muestra el nivel de verificación del servidor.
- Muestra el filtro de contenido explícito.
- Incluye estadísticas como miembros aproximados, boosts y región.

### ⬇️ Exportación Completa en ZIP
- Genera archivos `.txt` organizados por categorías.
- Descarga automática de imágenes (ícono, banner y splash del servidor).
- Carpeta de emojis organizada con las imágenes de las opciones de preguntas.
- Estructura de carpetas limpia dentro del archivo ZIP.

### 🔐 Seguridad y Privacidad
- Obtiene el token directamente del `localStorage` de Discord Web.
- **Sin servidores externos**: Todo el proceso ocurre en tu navegador.
- Código de fuente abierta para auditoría de seguridad.
- No requiere permisos de administrador en el servidor.

## 📋 Requisitos

- Navegador **Google Chrome** (o basado en Chromium).
- **Discord Web** abierto en una pestaña (`discord.com`).
- Estar visualizando un servidor de Discord.

## 🔧 Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/douglasvelezv/extension-de-incorporacion-de-discord.git
   ```
2. Ve a `chrome://extensions/` en tu navegador.
3. Activa el **Modo desarrollador**.
4. Haz clic en **"Cargar extensión sin empaquetar"**.
5. Selecciona la carpeta donde descargaste el proyecto.

## 📖 Instrucciones de Uso

1. **Entra a Discord**: Abre Discord Web y navega al servidor que quieres exportar.
2. **Abre la extensión**: Haz clic en el ícono de la pieza de puzzle y selecciona **Discord Onboarding Exporter**.
3. **Escanea**: Pulsa el botón **"Escanear"**.
4. **Revisa**: La interfaz mostrará secciones desplegables con la información obtenida.
5. **Descarga**: Haz clic en **"⬇️ Descargar ZIP completo"** para obtener todos los datos y archivos multimedia.

## 🏗️ Estructura del Proyecto

```
extension-de-incorporacion-de-discord/
├── manifest.json      # Configuración de la extensión
├── popup.html         # Interfaz visual del popup
├── popup.js           # Lógica de escaneo, renderizado y generación de ZIP
├── content.js         # Script para obtener token y guildId
├── icon16/48/128.png  # Iconografía de la extensión
└── README.md          # Este archivo
```

## 💻 Stack Tecnológico

- **Frontend**: HTML5, CSS3, JavaScript (ES6+).
- **API**: Discord API v10 (endpoints de `/guilds` y `/onboarding`).
- **ZIP**: Implementación ligera nativa de ZIP en JS (sin dependencias externas).

## 🔄 Flujo de la Extensión

```
1. Click en Escanear → Detecta Guild ID desde URL.
2. content.js → Extrae Token de localStorage.
3. API Discord → Consulta info del servidor y configuración de Onboarding.
4. UI Render → Muestra secciones: Incorporación, Preguntas y Normas.
5. ZIP Engine → Procesa textos e imágenes (Banner, Icon, Emojis) en carpetas.
```

## 📦 Formato del ZIP Exportado

```
onboarding_NombreServidor.zip
├── 1_Incorporacion/
│   ├── incorporacion.txt   # Mensaje de bienvenida, canales y tareas
│   ├── icono_servidor.png
│   ├── banner_servidor.png
│   └── emojis/             # Emojis usados en las tareas
├── 2_Preguntas/
│   ├── preguntas.txt       # Preguntas, opciones, roles y canales
│   └── emojis/             # Emojis de las opciones de preguntas
└── 3_Normas/
    └── normas.txt          # Nivel de verificación, reglas y estadísticas
```

## 🔒 Privacidad y Seguridad

- ✅ El token de usuario **NUNCA** sale de tu computadora.
- ✅ No hay telemetría ni envío de datos a terceros.
- ✅ La extensión solo lee datos del servidor que tú estás viendo activamente.
- ✅ Código 100% transparente.

## 📝 Licencia

Este proyecto está bajo la licencia MIT.

## 👨‍💻 Autor

**douglasvelezv** - Discord Onboarding Exporter

- GitHub: [@douglasvelezv](https://github.com/douglasvelezv)
- Proyecto: [extension-de-incorporacion-de-discord](https://github.com/douglasvelezv/extension-de-incorporacion-de-discord)

---

**Hecho con ❤️ por [douglasvelezv](https://github.com/douglasvelezv)**

[⬆ volver arriba](#-discord-onboarding-exporter)
