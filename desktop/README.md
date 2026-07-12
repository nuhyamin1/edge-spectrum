# PF Video Room desktop app

This Electron app is a focused shell around the existing React/Agora Video Room. It does not copy the call logic, so the website and desktop app stay compatible and participants can join the same session from either one. The committed configuration connects to the Railway production deployment.

## Local development

From the repository root:

```powershell
npm run desktop:install
npm run desktop:dev
```

The command starts the Express API, React client, and Electron. To open Electron against servers you already started with `npm run dev`, run `npm run desktop` in another terminal.

## Production server

`desktop/config.json` must contain the public **frontend** URL. This project serves its frontend and API from the same Railway service:

```json
{
  "appUrl": "https://edge-spectrum-production.up.railway.app"
}
```

The production URL must use HTTPS so camera, microphone, WebRTC, and login data are protected in transit. You can temporarily override the configured URL during development with `VIDEO_ROOM_APP_URL` or `--app-url=https://...`.

## Build an installer

```powershell
npm run desktop:dist
```

On Windows this creates an NSIS installer under `desktop/dist`. The build stages in the system temporary directory first, which avoids Windows Desktop-folder protection locking Electron's unpacking directory. Build macOS DMG packages on macOS so signing and camera/microphone entitlements can be applied there.

## Security model

- Node.js is disabled in the website renderer.
- Context isolation, Chromium sandboxing, and web security remain enabled.
- Navigation is restricted to `/login` and `/desktop` routes on the configured frontend origin.
- Camera, microphone, fullscreen, and display capture are granted only to that origin.
- External HTTPS links open in the operating system browser.
