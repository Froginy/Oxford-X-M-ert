// Point d'entrée GSAP partagé : importer depuis ici pour que les plugins soient enregistrés une seule fois.
// Exemple dans un composant Astro :
//   <script>
//     import { gsap } from '../scripts/gsap';
//     gsap.to('[data-hero-flotte]', { y: -12, yoyo: true, repeat: -1, duration: 2, ease: 'sine.inOut' });
//   </script>
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

export { gsap, ScrollTrigger };
