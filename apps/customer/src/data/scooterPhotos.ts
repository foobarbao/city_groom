/**
 * @file Background photos of the scooter lockers page
 * (`views/ScooterLockersPage.vue`), in the order its chapters show them.
 *
 * Real photos from Wikimedia Commons under free licences that require
 * crediting the author and the licence: the page lists them in its "Crédits
 * photos" footer. Two photos show the idea (a parked electric scooter,
 * individual bicycle lockers in Frankfurt), not CityPal equipment, which does
 * not exist yet; the two Grenoble tram photos are the same files as the
 * portal's mission page. The files in `src/assets/scooters/` are resized
 * copies (1600 px wide); copies of CC BY-SA photos stay under CC BY-SA.
 * Sources and licences checked on 2026-10-26.
 */
import type { StoryPhoto } from '@city-groom/ui'

import coursJeanJaures from '../assets/scooters/cours-jean-jaures.jpg'
import frankfurtLockers from '../assets/scooters/frankfurt-lockers.jpg'
import ileVerteTram from '../assets/scooters/ile-verte-tram.jpg'
import vilniusScooterPark from '../assets/scooters/vilnius-scooter-park.jpg'

const COMMONS = 'https://commons.wikimedia.org/wiki/File:'

export const scooterPhotos: StoryPhoto[] = [
  {
    file: 'vilnius-scooter-park.jpg',
    src: vilniusScooterPark,
    focus: '58% center',
    title: 'Electric kick scooter on the Bastion Hill in Vilnius',
    author: 'Андрей Романенко',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: `${COMMONS}Electric_kick_scooter_on_the_Bastion_Hill_in_Vilnius.jpg`,
  },
  {
    file: 'frankfurt-lockers.jpg',
    src: frankfurtLockers,
    focus: '30% center',
    title: 'Frankfurt, Germany - Bicycle lockers',
    author: 'Alexis Jazz',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    sourceUrl: `${COMMONS}Frankfurt,_Germany_-_Bicycle_lockers.jpg`,
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
    file: 'cours-jean-jaures.jpg',
    src: coursJeanJaures,
    focus: 'center 70%',
    title: 'Looking down the tram tracks on Cours Jean Jaurès towards Bastille, Grenoble, 2026',
    author: 'DimiTalen',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: `${COMMONS}Looking_down_the_tram_tracks_on_Cours_Jean_Jaur%C3%A8s_towards_Bastille,_Grenoble,_2026.jpg`,
  },
]
