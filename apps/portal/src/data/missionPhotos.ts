/**
 * @file Background photos of the mission page (`views/MissionPage.vue`), in
 * the order the chapters show them.
 *
 * Real photos of green Grenoble streets and gardens from Wikimedia Commons,
 * under free licences that require crediting the author and the licence: the
 * page lists them in its "Crédits photos" footer. The files in
 * `src/assets/mission/` are resized copies (1600 px wide); copies of CC BY-SA
 * photos stay under CC BY-SA. Sources and licences checked on 2026-10-24.
 */
import type { StoryPhoto } from '@city-groom/ui'

import caserneDeBonneAllee from '../assets/mission/caserne-de-bonne-allee.jpg'
import caserneDeBonneCanal from '../assets/mission/caserne-de-bonne-canal.jpg'
import caserneDeBonneJardin from '../assets/mission/caserne-de-bonne-jardin.jpg'
import coursJeanJaures from '../assets/mission/cours-jean-jaures.jpg'
import ileVerteTram from '../assets/mission/ile-verte-tram.jpg'
import jardinDeVilleHotelDeVille from '../assets/mission/jardin-de-ville-hotel-de-ville.jpg'
import jardinDeVilleMassifs from '../assets/mission/jardin-de-ville-massifs.jpg'
import jardinDeVillePalmiers from '../assets/mission/jardin-de-ville-palmiers.jpg'

/** One background photo and the credit its licence requires (see `StoryPhoto`). */
export type MissionPhoto = StoryPhoto

const CC_BY_2 = { license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/' }
const VELLUT = 'Guilhem Vellut'
const COMMONS = 'https://commons.wikimedia.org/wiki/File:'

export const missionPhotos: MissionPhoto[] = [
  {
    file: 'cours-jean-jaures.jpg',
    src: coursJeanJaures,
    focus: 'center 70%',
    title: 'Looking down the tram tracks on Cours Jean Jaurès towards Bastille, Grenoble, 2026',
    author: 'DimiTalen',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: `${COMMONS}Looking_down_the_tram_tracks_on_Cours_Jean_Jaur%C3%A8s_towards_Bastille,_Grenoble,_2026.jpg`,
  },
  {
    file: 'jardin-de-ville-hotel-de-ville.jpg',
    src: jardinDeVilleHotelDeVille,
    focus: 'center',
    title: 'Jardin de Ville @ Grenoble (36018322583)',
    author: VELLUT,
    ...CC_BY_2,
    sourceUrl: `${COMMONS}Jardin_de_Ville_@_Grenoble_(36018322583).jpg`,
  },
  {
    file: 'ile-verte-tram.jpg',
    src: ileVerteTram,
    focus: 'center',
    title: 'Île Verte (tramway de Grenoble)',
    author: 'Kyro',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    sourceUrl: `${COMMONS}%C3%8Ele_Verte_(tramway_de_Grenoble).JPG`,
  },
  {
    file: 'caserne-de-bonne-canal.jpg',
    src: caserneDeBonneCanal,
    focus: 'center',
    title: 'Jardin de la Caserne de Bonne @ Grenoble (35992957474)',
    author: VELLUT,
    ...CC_BY_2,
    sourceUrl: `${COMMONS}Jardin_de_la_Caserne_de_Bonne_@_Grenoble_(35992957474).jpg`,
  },
  {
    file: 'jardin-de-ville-palmiers.jpg',
    src: jardinDeVillePalmiers,
    focus: 'center',
    title: 'Jardin de Ville @ Grenoble (35993133174)',
    author: VELLUT,
    ...CC_BY_2,
    sourceUrl: `${COMMONS}Jardin_de_Ville_@_Grenoble_(35993133174).jpg`,
  },
  {
    file: 'caserne-de-bonne-jardin.jpg',
    src: caserneDeBonneJardin,
    focus: 'center',
    title: 'Jardin de la Caserne de Bonne @ Grenoble (36018180253)',
    author: VELLUT,
    ...CC_BY_2,
    sourceUrl: `${COMMONS}Jardin_de_la_Caserne_de_Bonne_@_Grenoble_(36018180253).jpg`,
  },
  {
    file: 'jardin-de-ville-massifs.jpg',
    src: jardinDeVilleMassifs,
    focus: 'center',
    title: 'Grenoble Jardin de Ville',
    author: 'Zairon',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: `${COMMONS}Grenoble_Jardin_de_Ville.jpg`,
  },
  {
    file: 'caserne-de-bonne-allee.jpg',
    src: caserneDeBonneAllee,
    focus: 'center',
    title: 'Jardin de la Caserne de Bonne @ Grenoble (36827488035)',
    author: VELLUT,
    ...CC_BY_2,
    sourceUrl: `${COMMONS}Jardin_de_la_Caserne_de_Bonne_@_Grenoble_(36827488035).jpg`,
  },
]
