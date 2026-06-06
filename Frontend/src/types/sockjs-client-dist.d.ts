// LOT 48 P6.c — Déclaration de module pour l'import direct du bundle ESM de sockjs-client.
//
// Le provider WebSocket Emergency importe explicitement `sockjs-client/dist/sockjs`
// (le bundle déjà compilé) pour éviter les soucis de résolution avec Vite. Mais le
// package `@types/sockjs-client` ne couvre QUE l'API exposée par le entrypoint
// principal (`sockjs-client`), pas le sous-chemin `/dist/sockjs`. Sans cette
// déclaration, `tsc -b` casse en prod :
//   error TS7016: Could not find a declaration file for module 'sockjs-client/dist/sockjs'.
declare module 'sockjs-client/dist/sockjs' {
    import SockJS from 'sockjs-client';
    export default SockJS;
}
