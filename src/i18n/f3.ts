/**
 * De vaste teksten van F3, in drie talen.
 *
 * Waarom hier en niet in `src/i18n/tr.json` en de zusters: die woordenboeken
 * zijn het contract van F0/F1 (titel, beschrijving, h1 per pagina) en F5 werkt
 * er tegelijk in. Deze file is van F3 alleen, zodat twee sessies elkaar niet
 * in de weg zitten. Zodra de redactie deze teksten zelf wil beheren, verhuizen
 * ze naar een Markdown-collectie naast `paginas` en blijft de vorm gelijk.
 *
 * Alles wat hier staat is herleidbaar tot de oude site:
 * - de zeven diensten komen uit de opsomming in `pages.hizmetlerimiz` en uit de
 *   welkomsttekst op de hoofdpagina;
 * - de mijlpalen zijn de vijf zinnen van `/hakkimizda/`, letterlijk, in dezelfde
 *   volgorde;
 * - adres, telefoon, e-mail en openingsuren staan in `src/data/site.ts`.
 */
import type { Locale } from './config';
import type { Slug } from '../data/site';

export interface Dienst {
  titel: string;
  tekst: string;
  /** Doel van de tegel. Een concept wordt in de component naar `/iletisim/` geleid. */
  href: string;
}

export interface Mijlpaal {
  /** Jaartal of korte aanduiding links van de lijn. */
  jaar: string;
  label: string;
  tekst: string;
}

export interface LegeTekst {
  titel: string;
  tekst: string;
}

export interface F3Teksten {
  heroKlein: string;
  heroCta: string;
  heroCtaSecundair: string;
  dienstenKop: string;
  dienstenIntro: string;
  /** De link naast de kop op de homepage: niet de kop zelf nog eens. */
  dienstenAlle: string;
  /** De link onder een dienst op /hizmetlerimiz/: niet de titel nog eens. */
  dienstenMeer: string;
  diensten: Dienst[];
  steunKop: string;
  steunTekst: string;
  steunHint: string;
  /** Het sponsorblok zonder vast bedrag: daar staat geen getal, maar deze tekst. */
  steunVrijBedrag: string;
  mijlpalenKop: string;
  mijlpalen: Mijlpaal[];
  contactKop: string;
  contactIntro: string;
  labelAdres: string;
  labelTelefoon: string;
  labelEmail: string;
  labelUren: string;
  labelRoute: string;
  routeTekst: string;
  whatsappLabel: string;
  whatsappAria: string;
  juridischNoot: string;
  leeg: Record<'subelerimiz' | 'bolge-derneklerimiz' | 'namaz-vakitleri' | 'cuma-hutbesi', LegeTekst>;
}

const TR: F3Teksten = {
  heroKlein: '1979’dan beri Brüksel’de',
  heroCta: 'Bizi tanıyın',
  heroCtaSecundair: 'Namaz vakitleri',
  dienstenKop: 'Hizmetlerimiz',
  dienstenIntro:
    'Yedi başlıkta hizmet veriyoruz. Elinizdeki her hizmetin arkasında bir şube, bir gönüllü ve bir kapı var.',
  dienstenAlle: 'Tüm hizmetler',
  dienstenMeer: 'Daha fazla',
  diensten: [
    {
      titel: 'Namaz Vakitleri',
      tekst: 'Brüksel ve şubelerimiz için günlük vakitler: imsak, güneş, öğle, ikindi, akşam ve yatsı.',
      href: '/namaz-vakitleri',
    },
    {
      titel: 'Cuma Hutbesi',
      tekst: 'Haftalık hutbelerin arşivi, en yeni hutbe başta, her hutbe için metin ve isteğe bağlı pdf.',
      href: '/cuma-hutbesi',
    },
    {
      titel: 'Şubelerimiz',
      tekst: 'Belçika genelindeki şubelerimiz: adres, telefon ve harita üzerinde konum.',
      href: '/subelerimiz',
    },
    {
      titel: 'Bağış',
      tekst: 'Desteğiniz dini, sosyal ve kültürel hizmetlerimizi mümkün kılıyor.',
      href: '/bagislar',
    },
    {
      titel: 'Eğitim ve Gençlik Hizmetleri',
      tekst: 'Şubelerimizde çocuklarımıza ve gençlerimize dini ve ahlaki eğitimin yanı sıra okul derslerine destek, sosyal ve kültürel faaliyetler sunmaktayız.',
      href: '/hakkimizda',
    },
    {
      titel: 'Cami Tanıtım Programları',
      tekst: 'Okullar, kurumlar ve ilgilenen herkes için cami ziyaretleri düzenliyoruz. Ziyaretler için en yakın şubemizle iletişime geçebilirsiniz.',
      href: '/subelerimiz',
    },
    {
      titel: 'Açık Cami Günü',
      tekst: 'Her yıl düzenlenen Açık Cami Günü’nde kapılarımızı tüm komşularımıza açıyor, tanışma ve diyalog ortamı oluşturuyoruz.',
      href: '/haberler',
    },
  ],
  steunKop: 'Desteğiniz',
  steunTekst:
    'Her bağış doğrudan dini, sosyal ve kültürel hizmetlere gider. Bir tutar seçin; ödeme sayfası yeni bir sekmede açılır.',
  steunHint: 'Tutarlar euro. Ödeme Mollie üzerinden yapılır.',
  steunVrijBedrag: 'Miktarı Giriniz',
  mijlpalenKop: 'Kısaca tarihimiz',
  mijlpalen: [
    {
      jaar: '1979',
      label: 'Kuruluş',
      tekst:
        'İslam Kültür Merkezleri Birliği 1979 senesinde Brüksel’de kurulmuş dini cemaat statüsüne sahip bir İslami teşkilattır.',
    },
    {
      jaar: 'Statü',
      label: 'Bağımsız',
      tekst: 'Bağımsız, partiler üstü ve umuma hadimdir.',
    },
    {
      jaar: 'Amaç',
      label: 'Hizmet',
      tekst:
        'Derneğin amacı, Belçika’da yaşayan Müslümanlara dini, sosyal ve kültürel alanlarda kapsamlı hizmetler sunmaktır.',
    },
    {
      jaar: 'Görev',
      label: 'Diyalog',
      tekst:
        'Bir diğer temel görev ise, İslam’ın ve Müslümanların Avrupa toplumunun birer parçası olarak kabul edilmeleri ve kültürlerarası iletişimin sağlanmasıdır.',
    },
    {
      jaar: 'Bugün',
      label: 'İş birliği',
      tekst:
        'Bu amaçla UCCİB, Federal Belçika Devleti’nde belediye, eyalet ve federal düzeyde birçok dini, sosyal ve devlet kurumuyla ortak çalışmalarda bulunmaktadır.',
    },
  ],
  contactKop: 'Bize ulaşın',
  contactIntro:
    'Sorularınız, ziyaret talepleriniz ve bağış bilgileri için sekretaryamızı arayabilir veya yazabilirsiniz.',
  labelAdres: 'Adres',
  labelTelefoon: 'Telefon',
  labelEmail: 'E-posta',
  labelUren: 'Açık olduğumuz saatler',
  labelRoute: 'Yol tarifi',
  routeTekst: 'Haritada aç',
  whatsappLabel: 'WhatsApp’tan yazın',
  whatsappAria: 'WhatsApp sohbetini aç',
  juridischNoot:
    'Bu hukuki metin yalnızca Türkçe yayımlanmıştır. Sorularınız için bize yazabilirsiniz.',
  leeg: {
    subelerimiz: {
      titel: 'Şube bilgileri hazırlanıyor',
      tekst:
        'Belçika genelindeki şubelerimizin adres ve iletişim bilgilerini tek tek doğruluyoruz. Yanlış bir adres, kaybolmuş bir ziyaretçiden daha kötüdür. Bu arada sekretaryamız size en yakın şubeyi telefonla söyleyebilir.',
    },
    'bolge-derneklerimiz': {
      titel: 'Bölge dernekleri listesi hazırlanıyor',
      tekst:
        'Bölge derneklerimizin listesini bölge bazında, adları ve iletişim bilgileriyle birlikte yayımlayacağız. Liste hazır olana kadar bize yazarak en yakın dernek hakkında bilgi alabilirsiniz.',
    },
    'namaz-vakitleri': {
      titel: 'Vakit çizelgesi hazırlanıyor',
      tekst:
        'Brüksel ve Belçika şehirleri için günlük vakitleri tek bir çizelgede yayımlayacağız: imsak, güneş, öğle, ikindi, akşam ve yatsı. O zamana kadar vakitleri şubelerimizden öğrenebilirsiniz.',
    },
    'cuma-hutbesi': {
      titel: 'Hutbe arşivi hazırlanıyor',
      tekst:
        'Haftalık hutbelerimizi metin ve isteğe bağlı pdf ile arşivleyeceğiz, en yeni hutbe başta. Şu an için hutbeler camilerimizde okunmaktadır.',
    },
  },
};

const NL: F3Teksten = {
  heroKlein: 'Sinds 1979 in Brussel',
  heroCta: 'Maak kennis met ons',
  heroCtaSecundair: 'Gebedstijden',
  dienstenKop: 'Onze diensten',
  dienstenIntro:
    'Wij werken rond zeven thema’s. Achter elke dienst staat een vestiging, een vrijwilliger en een deur die openstaat.',
  dienstenAlle: 'Alle diensten',
  dienstenMeer: 'Meer info',
  diensten: [
    {
      titel: 'Gebedstijden',
      tekst:
        'De dagelijkse tijden voor Brussel en onze vestigingen: imsak, zonsopgang, middag, namiddag, avond en nacht.',
      href: '/namaz-vakitleri',
    },
    {
      titel: 'Vrijdagpreek',
      tekst:
        'Het archief van de wekelijkse preken, de nieuwste eerst, met per preek de tekst en optioneel een pdf.',
      href: '/cuma-hutbesi',
    },
    {
      titel: 'Onze vestigingen',
      tekst: 'Onze vestigingen in heel België: adres, telefoon en de plaats op de kaart.',
      href: '/subelerimiz',
    },
    {
      titel: 'Schenken',
      tekst: 'Uw steun maakt onze religieuze, sociale en culturele werking mogelijk.',
      href: '/bagislar',
    },
    {
      titel: 'Onderwijs en jeugdwerk',
      tekst:
        'In onze vestigingen bieden wij kinderen en jongeren naast godsdienstige en morele vorming ook ondersteuning bij de schoolvakken, en sociale en culturele activiteiten.',
      href: '/hakkimizda',
    },
    {
      titel: 'Moskeebezoeken',
      tekst:
        'Voor scholen, instellingen en iedereen die interesse heeft organiseren wij bezoeken aan de moskee. Neem daarvoor contact op met de dichtstbijzijnde vestiging.',
      href: '/subelerimiz',
    },
    {
      titel: 'Open Moskeedag',
      tekst:
        'Tijdens de jaarlijkse Open Moskeedag zetten wij onze deuren open voor alle buren en creëren wij een ontmoeting en een gesprek.',
      href: '/haberler',
    },
  ],
  steunKop: 'Uw steun',
  steunTekst:
    'Elke gift gaat rechtstreeks naar de religieuze, sociale en culturele werking. Kies een bedrag; de betaalpagina opent in een nieuw tabblad.',
  steunHint: 'De bedragen zijn in euro. De betaling verloopt via Mollie.',
  steunVrijBedrag: 'Kies zelf een bedrag',
  mijlpalenKop: 'Onze geschiedenis in het kort',
  mijlpalen: [
    {
      jaar: '1979',
      label: 'Oprichting',
      tekst:
        'De Unie van Islamitische Cultuurcentra werd in 1979 in Brussel opgericht als islamitische organisatie met de status van eredienst.',
    },
    {
      jaar: 'Statuit',
      label: 'Onafhankelijk',
      tekst: 'Zij is onafhankelijk, boven de partijen en ten dienste van het publiek.',
    },
    {
      jaar: 'Doel',
      label: 'Dienst',
      tekst:
        'De vereniging wil moslims in België op religieus, sociaal en cultureel vlak een breed aanbod aan diensten bieden.',
    },
    {
      jaar: 'Opdracht',
      label: 'Dialoog',
      tekst:
        'Een tweede kerntaak is dat de islam en de moslims als deel van de Europese samenleving worden aanvaard en dat er interculturele communicatie tot stand komt.',
    },
    {
      jaar: 'Vandaag',
      label: 'Samenwerking',
      tekst:
        'Daarvoor werkt UCCIB in de Belgische federale staat samen met tal van religieuze, sociale en overheidsinstellingen op gemeentelijk, provinciaal en federaal niveau.',
    },
  ],
  contactKop: 'Bereik ons',
  contactIntro:
    'Voor vragen, een bezoekaanvraag of informatie over schenken kunt u ons secretariaat bellen of schrijven.',
  labelAdres: 'Adres',
  labelTelefoon: 'Telefoon',
  labelEmail: 'E-mail',
  labelUren: 'Wanneer wij open zijn',
  labelRoute: 'Route',
  routeTekst: 'Open in kaart',
  whatsappLabel: 'Stuur een WhatsApp',
  whatsappAria: 'Open de WhatsApp-gesprek',
  juridischNoot:
    'Deze juridische tekst is alleen in het Turks gepubliceerd. Voor vragen kunt u ons schrijven.',
  leeg: {
    subelerimiz: {
      titel: 'De vestigingen worden aangevuld',
      tekst:
        'Wij controleren de adressen en contactgegevens van al onze vestigingen in België een voor een. Een verkeerd adres is erger dan een bezoeker die even wacht. In de tussentijd noemt ons secretariaat u graag de dichtstbijzijnde vestiging.',
    },
    'bolge-derneklerimiz': {
      titel: 'De lijst van de regionale verenigingen volgt',
      tekst:
        'Wij publiceren de regionale verenigingen per regio, met naam en contactgegevens. Tot die lijst er is, helpen wij u graag verder aan de telefoon.',
    },
    'namaz-vakitleri': {
      titel: 'Het tijdschema wordt opgemaakt',
      tekst:
        'Wij brengen de dagelijkse tijden voor Brussel en de Belgische steden in één schema samen: imsak, zonsopgang, middag, namiddag, avond en nacht. Tot dan kunt u de tijden bij onze vestigingen vragen.',
    },
    'cuma-hutbesi': {
      titel: 'Het preekarchief wordt opgebouwd',
      tekst:
        'Wij archiveren de wekelijkse preken met de tekst en optioneel een pdf, de nieuwste eerst. Voorlopig worden de preken in onze moskeeën gehouden.',
    },
  },
};

const FR: F3Teksten = {
  heroKlein: 'À Bruxelles depuis 1979',
  heroCta: 'Faites notre connaissance',
  heroCtaSecundair: 'Heures de prière',
  dienstenKop: 'Nos services',
  dienstenIntro:
    'Nous travaillons autour de sept thèmes. Derrière chaque service, il y a un centre, un bénévole et une porte ouverte.',
  dienstenAlle: 'Tous les services',
  dienstenMeer: 'En savoir plus',
  diensten: [
    {
      titel: 'Heures de prière',
      tekst:
        'Les horaires quotidiens pour Bruxelles et nos centres : imsak, lever du soleil, midi, après-midi, soir et nuit.',
      href: '/namaz-vakitleri',
    },
    {
      titel: 'Prêche du vendredi',
      tekst:
        'Les archives des prêches hebdomadaires, le plus récent en premier, avec le texte et, si disponible, un pdf.',
      href: '/cuma-hutbesi',
    },
    {
      titel: 'Nos centres',
      tekst: 'Nos centres dans toute la Belgique : adresse, téléphone et position sur la carte.',
      href: '/subelerimiz',
    },
    {
      titel: 'Faire un don',
      tekst: 'Votre soutien rend possible notre travail religieux, social et culturel.',
      href: '/bagislar',
    },
    {
      titel: 'Enseignement et jeunesse',
      tekst:
        'Dans nos centres, nous offrons aux enfants et aux jeunes, outre une formation religieuse et morale, un soutien pour les cours scolaires ainsi que des activités sociales et culturelles.',
      href: '/hakkimizda',
    },
    {
      titel: 'Visites de la mosquée',
      tekst:
        'Nous organisons des visites de la mosquée pour les écoles, les institutions et toute personne intéressée. Pour une visite, contactez le centre le plus proche.',
      href: '/subelerimiz',
    },
    {
      titel: 'Journée portes ouvertes',
      tekst:
        'Lors de la Journée portes ouvertes annuelle, nous ouvrons nos portes à tous nos voisins et créons un lieu de rencontre et de dialogue.',
      href: '/haberler',
    },
  ],
  steunKop: 'Votre soutien',
  steunTekst:
    'Chaque don va directement à notre travail religieux, social et culturel. Choisissez un montant ; la page de paiement s’ouvre dans un nouvel onglet.',
  steunHint: 'Les montants sont en euros. Le paiement se fait via Mollie.',
  steunVrijBedrag: 'Choisir un montant',
  mijlpalenKop: 'Notre histoire en bref',
  mijlpalen: [
    {
      jaar: '1979',
      label: 'Fondation',
      tekst:
        'L’Union des Centres Culturels Islamiques a été fondée en 1979 à Bruxelles, en tant qu’organisation islamique reconnue comme communauté religieuse.',
    },
    {
      jaar: 'Statut',
      label: 'Indépendance',
      tekst: 'Elle est indépendante, au-dessus des partis et au service du public.',
    },
    {
      jaar: 'But',
      label: 'Service',
      tekst:
        'L’association veut offrir aux musulmans de Belgique un large éventail de services religieux, sociaux et culturels.',
    },
    {
      jaar: 'Mission',
      label: 'Dialogue',
      tekst:
        'Une autre mission essentielle est que l’islam et les musulmans soient acceptés comme partie intégrante de la société européenne et que la communication interculturelle s’établisse.',
    },
    {
      jaar: 'Aujourd’hui',
      label: 'Coopération',
      tekst:
        'À cette fin, l’UCCIB collabore, dans l’État fédéral belge, avec de nombreuses institutions religieuses, sociales et publiques aux niveaux communal, provincial et fédéral.',
    },
  ],
  contactKop: 'Nous joindre',
  contactIntro:
    'Pour vos questions, une demande de visite ou des informations sur les dons, vous pouvez appeler ou écrire à notre secrétariat.',
  labelAdres: 'Adresse',
  labelTelefoon: 'Téléphone',
  labelEmail: 'E-mail',
  labelUren: 'Nos heures d’ouverture',
  labelRoute: 'Itinéraire',
  routeTekst: 'Ouvrir dans la carte',
  whatsappLabel: 'Écrire sur WhatsApp',
  whatsappAria: 'Ouvrir la conversation WhatsApp',
  juridischNoot:
    'Ce texte juridique n’est publié qu’en turc. Pour toute question, vous pouvez nous écrire.',
  leeg: {
    subelerimiz: {
      titel: 'Les centres sont en cours de complétion',
      tekst:
        'Nous vérifions une à une les adresses et les coordonnées de tous nos centres en Belgique. Une adresse erronée est pire qu’un visiteur qui attend un peu. Entre-temps, notre secrétariat vous indique volontiers le centre le plus proche.',
    },
    'bolge-derneklerimiz': {
      titel: 'La liste des associations régionales suit',
      tekst:
        'Nous publierons les associations régionales par région, avec leur nom et leurs coordonnées. En attendant cette liste, nous vous aidons volontiers par téléphone.',
    },
    'namaz-vakitleri': {
      titel: 'Le tableau des horaires est en préparation',
      tekst:
        'Nous réunirons les horaires quotidiens de Bruxelles et des villes belges dans un seul tableau : imsak, lever du soleil, midi, après-midi, soir et nuit. D’ici là, vous pouvez demander les horaires à nos centres.',
    },
    'cuma-hutbesi': {
      titel: 'Les archives des prêches se constituent',
      tekst:
        'Nous archivons les prêches hebdomadaires avec le texte et, si disponible, un pdf, le plus récent en premier. Pour l’instant, les prêches sont donnés dans nos mosquées.',
    },
  },
};

export const F3: Record<Locale, F3Teksten> = { tr: TR, nl: NL, fr: FR };

export function f3(locale: Locale): F3Teksten {
  return F3[locale];
}

/**
 * De twaalf pagina's die F3 vult: alle veertien min de twee van F5
 * (`/bagislar/` en `/bagis-onayi/`). Leeg is de homepage. De drie dynamische
 * routes lezen deze lijst, zodat er één plek is die zegt welke pagina's bestaan.
 */
export const F3_PAGINAS = [
  '',
  'hakkimizda',
  'hizmetlerimiz',
  'haberler',
  'iletisim',
  'subelerimiz',
  'bolge-derneklerimiz',
  'namaz-vakitleri',
  'cuma-hutbesi',
  'disclameer',
  'cerez-politikasi-cookie-policy',
  'baharkermesi-menu',
] as const satisfies readonly Slug[];
