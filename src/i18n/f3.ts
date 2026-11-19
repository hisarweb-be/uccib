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
  /** Doel van de regel. Een concept-pagina krijgt in DienstenIndex `data-binnenkort` en haar leeg-titel. */
  href: string;
  /** Plek op de startpagina: `deur` is de kop van OpenDeur, `bezoek` de regel eronder. */
  rol?: 'deur' | 'bezoek';
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
  /** De gebedstijden: kop, labels en de korte teksten op de strook en het blad. */
  vakitler: {
    kop: string;
    lead: string;
    volgend: string;
    nogNiet: string;
    stad: string;
    tijd: string;
    week: string;
    bron: string;
    opgehaald: string;
    meer: string;
    geen: string;
    fout: string;
  };
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
  /** Label van het bezoekadres (site.ts) in voet en contactpagina; het zeteladres uit de KBO heeft labelZetel. */
  labelBezoekadres: string;
  labelTelefoon: string;
  labelEmail: string;
  labelUren: string;
  labelRoute: string;
  /** Label van het ondernemingsnummer in het adresblad (alleen als kerngegevens.kbo gevuld is). */
  labelKbo: string;
  /** Label van de officiële naam en rechtsvorm uit de KBO. */
  labelRechtspersoon: string;
  /** Label van het zeteladres uit de KBO (src/lib/rechtspersoon.ts). */
  labelZetel: string;
  /** Alleen Turks: vertaling van de rechtsvorm, achter de officiële term tussen haakjes. */
  rechtsvormUitleg?: string;
  /** Het land achter het bezoekadres. */
  land: string;
  routeTekst: string;
  whatsappLabel: string;
  whatsappAria: string;
  juridischNoot: string;
  /**
   * De eerlijke binnenkort-tekst per pagina die uit kan staan: elk menupunt en
   * elke dienst. Geen tijd, aantal of plaats: die feiten zijn niet bevestigd.
   */
  leeg: Record<LeegSlug, LegeTekst>;
  /**
   * De 404 (DESIGNSYSTEEM 7.13): kop, één zin, label van de bestemmingenlijst en
   * de meta-beschrijving. De Turkse kop zoekt verify-een-voor-een.
   */
  nietGevonden: { kop: string; lead: string; lijstLabel: string; beschrijving: string };
  /**
   * De bedankpagina na een donatie (/bagis-onayi/): alt-tekst van de Turkse
   * dankkaart en de twee knoppen. Kop en beschrijving staan in de taal-json.
   */
  bedankt: { beeldAlt: string; terug: string; opnieuw: string };
  /** Toegankelijke naam van de menuknop in de kop (DESIGNSYSTEEM 7.3). */
  rozetMenuOpen: string;
  rozetMenuSluit: string;
  /** De vier slagen van de piek, in volgorde (BRIEF); zelfde zin als dienstenIntro. */
  piekSlagen: readonly [string, string, string, string];
}

/** Pagina's met een eigen binnenkort-tekst. InAanbouw leest ze hieruit. */
export const LEEG_SLUGS = [
  'hakkimizda',
  'haberler',
  'bolge-derneklerimiz',
  'subelerimiz',
  'namaz-vakitleri',
  'cuma-hutbesi',
  'bagislar',
  'baharkermesi-menu',
] as const;
export type LeegSlug = (typeof LEEG_SLUGS)[number];

const TR: F3Teksten = {
  heroKlein: '1979’dan beri Brüksel’de',
  heroCta: 'Bizi tanıyın',
  heroCtaSecundair: 'Namaz vakitleri',
  dienstenKop: 'Hizmetlerimiz',
  dienstenIntro:
    'Elinizdeki her hizmetin arkasında bir şube, bir gönüllü ve bir kapı var.',
  dienstenAlle: 'Tüm hizmetler',
  dienstenMeer: 'Daha fazla',
  vakitler: {
    kop: 'Namaz vakitleri',
    lead: 'Brüksel ve Belçika şehirleri için Fazilet takvimine göre günlük vakitler.',
    volgend: 'Sıradaki vakit',
    nogNiet: 'Henüz vakit yok',
    stad: 'Şehir',
    tijd: 'Vakit',
    week: 'Yedi gün',
    bron: 'Kaynak: Fazilet Takvimi',
    opgehaald: 'alındı',
    meer: 'Tüm şehirler ve hafta',
    geen: 'Vakitlere şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin.',
    fout: 'Canlı vakitler alınamadı; son derlemedeki vakitler gösteriliyor.',
  },
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
      rol: 'bezoek',
    },
    {
      titel: 'Açık Cami Günü',
      tekst: 'Her yıl düzenlenen Açık Cami Günü’nde kapılarımızı tüm komşularımıza açıyor, tanışma ve diyalog ortamı oluşturuyoruz.',
      href: '/haberler',
      rol: 'deur',
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
  labelBezoekadres: 'Ziyaret adresi',
  labelTelefoon: 'Telefon',
  labelEmail: 'E-posta',
  labelUren: 'Açık olduğumuz saatler',
  labelRoute: 'Yol tarifi',
  routeTekst: 'Haritada aç',
  labelKbo: 'KBO',
  labelRechtspersoon: 'Tüzel kişi',
  labelZetel: 'Kayıtlı merkez',
  rechtsvormUitleg: 'kamu yararına vakıf',
  land: 'Belçika',
  whatsappLabel: 'WhatsApp’tan yazın',
  whatsappAria: 'WhatsApp sohbetini aç',
  juridischNoot:
    'Bu hukuki metin 19 Kasım 2026 tarihinde güncellenmiştir. Sorularınız için info@uccib.com adresine yazabilirsiniz.',
  leeg: {
    subelerimiz: {
      titel: 'Şube bilgileri hazırlanıyor',
      tekst:
        'Şubelerimizin adres ve iletişim bilgilerini tek tek doğruluyoruz. Yanlış bir adres, kaybolmuş bir ziyaretçiden daha kötüdür. Bu arada sekretaryamız size en yakın şubeyi telefonla söyleyebilir.',
    },
    'bolge-derneklerimiz': {
      titel: 'Bölge dernekleri listesi hazırlanıyor',
      tekst:
        'Bölge derneklerimizin listesini bölge bazında, adları ve iletişim bilgileriyle birlikte yayımlayacağız. Liste hazır olana kadar bize yazarak en yakın dernek hakkında bilgi alabilirsiniz.',
    },
    'namaz-vakitleri': {
      titel: 'Vakit çizelgesi hazırlanıyor',
      tekst:
        'Günlük vakitleri tek bir çizelgede yayımlayacağız: imsak, güneş, öğle, ikindi, akşam ve yatsı. O zamana kadar vakitleri şubelerimizden öğrenebilirsiniz.',
    },
    'cuma-hutbesi': {
      titel: 'Hutbe arşivi hazırlanıyor',
      tekst:
        'Hutbelerimizi metin ve isteğe bağlı pdf ile arşivleyeceğiz, en yeni hutbe başta. Şu an için hutbeler camilerimizde okunmaktadır.',
    },
    haberler: {
      titel: 'Haberler bölümü hazırlanıyor',
      tekst:
        'Sitenin haberler bölümünü yeniden kuruyoruz. O zamana kadar duyurularımızı ve etkinliklerimizi iletişim sayfasından veya telefonla öğrenebilirsiniz.',
    },
    'baharkermesi-menu': {
      titel: 'Bahar çarşısı menüsü arşivde',
      tekst:
        'Son bahar çarşısı geride kaldı. O günün menüsünü arşiv olarak saklıyoruz. Derneğimiz yeni tarihi belirlediğinde güncel menü burada yayımlanacak.',
    },
    hakkimizda: {
      titel: 'Hakkımızda sayfası hazırlanıyor',
      tekst:
        'Birliğimizi anlatan sayfayı yeniden yazıyoruz. O zamana kadar sorularınızı telefonla veya e-postayla sekretaryamıza iletebilirsiniz.',
    },
    bagislar: {
      titel: 'Bağış sayfası hazırlanıyor',
      tekst:
        'Güvenli bağış bağlantılarını yeniden düzenliyoruz. Bu arada bağış yapmak isterseniz sekretaryamız size yardımcı olur.',
    },
  },
  nietGevonden: {
    kop: 'Sayfa bulunamadı',
    lead: 'Aradığınız sayfa taşınmış veya kaldırılmış olabilir.',
    lijstLabel: 'Sitedeki sayfalar',
    beschrijving:
      'Aradığınız sayfa bulunamadı. Ana sayfadan veya aşağıdaki sayfalardan devam edebilirsiniz.',
  },
  bedankt: {
    beeldAlt:
      'Teşekkür kartı. Değerli Kardeşim, şimdiye kadar olduğu gibi maddi ve manevi yardımlarını esirgemeyen, yaptığı hayır-hasenatla destek olan, ilim öğrenen Kur’an talebelerine sahip çıkan, bu gibi hayırları fırsat bilip en güzel şekilde değerlendiren siz değerli kardeşlerimize, emeği geçen, üzerimizde hakkı olan herkese şükranlarımızı arzederiz. Teşekkür Ederiz. Hz Allah razı olsun. Altta UCCIB logosu.',
    terug: 'Ana sayfaya dön',
    opnieuw: 'Yeniden bağış yap',
  },
  rozetMenuOpen: 'Menü',
  rozetMenuSluit: 'Menüyü kapat',
  piekSlagen: ['Elinizdeki her hizmetin arkasında', 'bir şube,', 'bir gönüllü', 've bir kapı var.'],
};

const NL: F3Teksten = {
  heroKlein: 'Sinds 1979 in Brussel',
  heroCta: 'Maak kennis met ons',
  heroCtaSecundair: 'Gebedstijden',
  dienstenKop: 'Onze diensten',
  dienstenIntro:
    'Achter elke dienst staat een afdeling, een vrijwilliger en een deur die openstaat.',
  dienstenAlle: 'Alle diensten',
  dienstenMeer: 'Meer info',
  vakitler: {
    kop: 'Gebedstijden',
    lead: 'De gebedstijden voor Brussel en de Belgische steden, volgens de Fazilet-kalender.',
    volgend: 'Volgend gebed',
    nogNiet: 'Nog geen tijd bekend',
    stad: 'Stad',
    tijd: 'Tijd',
    week: 'Zeven dagen',
    bron: 'Bron: Fazilet Takvimi',
    opgehaald: 'opgehaald',
    meer: 'Alle steden en de week',
    geen: 'De gebedstijden zijn nu niet bereikbaar. Probeer het later opnieuw.',
    fout: 'De verse tijden zijn niet opgehaald; de tijden van de laatste bouw staan er.',
  },
  diensten: [
    {
      titel: 'Gebedstijden',
      tekst:
        'De dagelijkse tijden voor Brussel en onze afdelingen: imsak, zonsopgang, middag, namiddag, avond en nacht.',
      href: '/namaz-vakitleri',
    },
    {
      titel: 'Vrijdagpreek',
      tekst:
        'Het archief van de wekelijkse preken, de nieuwste eerst, met per preek de tekst en optioneel een pdf.',
      href: '/cuma-hutbesi',
    },
    {
      titel: 'Onze afdelingen',
      tekst: 'Onze afdelingen in heel België: adres, telefoon en de plaats op de kaart.',
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
        'In onze afdelingen bieden wij kinderen en jongeren naast godsdienstige en morele vorming ook ondersteuning bij de schoolvakken, en sociale en culturele activiteiten.',
      href: '/hakkimizda',
    },
    {
      titel: 'Moskeebezoeken',
      tekst:
        'Voor scholen, instellingen en iedereen die interesse heeft organiseren wij bezoeken aan de moskee. Neem daarvoor contact op met de dichtstbijzijnde afdeling.',
      href: '/subelerimiz',
      rol: 'bezoek',
    },
    {
      titel: 'Open Moskeedag',
      tekst:
        'Tijdens de jaarlijkse Open Moskeedag zetten wij onze deuren open voor alle buren en creëren wij een ontmoeting en een gesprek.',
      href: '/haberler',
      rol: 'deur',
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
      jaar: 'Statuut',
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
  labelBezoekadres: 'Bezoekadres',
  labelTelefoon: 'Telefoon',
  labelEmail: 'E-mail',
  labelUren: 'Wanneer wij open zijn',
  labelRoute: 'Route',
  routeTekst: 'Open in kaart',
  labelKbo: 'KBO',
  labelRechtspersoon: 'Rechtspersoon',
  labelZetel: 'Maatschappelijke zetel',
  land: 'België',
  whatsappLabel: 'Stuur een WhatsApp',
  whatsappAria: 'Open de WhatsApp-gesprek',
  juridischNoot:
    'Deze juridische tekst is bijgewerkt op 19 november 2026. Vragen? Schrijf naar info@uccib.com.',
  leeg: {
    subelerimiz: {
      titel: 'De afdelingen worden aangevuld',
      tekst:
        'Wij controleren de adressen en contactgegevens van onze afdelingen een voor een. Een verkeerd adres is erger dan een bezoeker die even wacht. In de tussentijd noemt ons secretariaat u graag de dichtstbijzijnde afdeling.',
    },
    'bolge-derneklerimiz': {
      titel: 'De lijst van de regionale verenigingen volgt',
      tekst:
        'Wij publiceren de regionale verenigingen per regio, met naam en contactgegevens. Tot die lijst er is, helpen wij u graag verder aan de telefoon.',
    },
    'namaz-vakitleri': {
      titel: 'Het tijdschema wordt opgemaakt',
      tekst:
        'Wij brengen de dagelijkse tijden in één schema samen: imsak, zonsopgang, middag, namiddag, avond en nacht. Tot dan kunt u de tijden bij onze afdelingen vragen.',
    },
    'cuma-hutbesi': {
      titel: 'Het preekarchief wordt opgebouwd',
      tekst:
        'Wij archiveren de preken met de tekst en optioneel een pdf, de nieuwste eerst. Voorlopig worden de preken in onze moskeeën gehouden.',
    },
    haberler: {
      titel: 'De nieuwsrubriek wordt opgebouwd',
      tekst:
        'Wij bouwen de nieuwsrubriek van de site opnieuw op. Tot dan leest u onze aankondigingen en activiteiten via de contactpagina of hoort u ze aan de telefoon.',
    },
    'baharkermesi-menu': {
      titel: 'Het menu van de lentejaarmarkt is archief',
      tekst:
        'De vorige lentejaarmarkt is voorbij. Het menu van die dag bewaren wij als archief. Zodra de vereniging de nieuwe datum vastlegt, staat het nieuwe menu hier.',
    },
    hakkimizda: {
      titel: 'De pagina over ons wordt herschreven',
      tekst:
        'Wij schrijven de pagina over onze unie opnieuw. Tot dan beantwoordt ons secretariaat uw vragen graag per telefoon of e-mail.',
    },
    bagislar: {
      titel: 'De pagina voor giften wordt klaargemaakt',
      tekst:
        'Wij zetten de veilige betaallinks opnieuw klaar. Wilt u in de tussentijd een gift doen, dan helpt ons secretariaat u graag.',
    },
  },
  nietGevonden: {
    kop: 'Pagina niet gevonden',
    lead: 'De pagina die u zoekt, is misschien verplaatst of verwijderd.',
    lijstLabel: 'Pagina’s op deze site',
    beschrijving:
      'De pagina die u zoekt, bestaat hier niet. Ga verder via de startpagina of een van de pagina’s hieronder.',
  },
  bedankt: {
    beeldAlt:
      'Turkse dankkaart van UCCIB: een dankwoord aan iedereen die met giften en hulp de werking en de Koranleerlingen steunt, afgesloten met “Teşekkür Ederiz” (wij danken u) en “Allah razı olsun” (moge God tevreden over u zijn). Onderaan het logo van UCCIB.',
    terug: 'Terug naar de hoofdpagina',
    opnieuw: 'Nog een donatie',
  },
  rozetMenuOpen: 'Menu',
  rozetMenuSluit: 'Menu sluiten',
  piekSlagen: ['Achter elke dienst staat', 'een afdeling,', 'een vrijwilliger', 'en een deur die openstaat.'],
};

const FR: F3Teksten = {
  heroKlein: 'À Bruxelles depuis 1979',
  heroCta: 'Faites notre connaissance',
  heroCtaSecundair: 'Heures de prière',
  dienstenKop: 'Nos services',
  dienstenIntro:
    'Derrière chaque service, il y a une section, un bénévole et une porte ouverte.',
  dienstenAlle: 'Tous les services',
  dienstenMeer: 'En savoir plus',
  vakitler: {
    kop: 'Heures de prière',
    lead: 'Les heures de prière pour Bruxelles et les villes belges, selon le calendrier Fazilet.',
    volgend: 'Prochaine prière',
    nogNiet: 'Aucune heure connue',
    stad: 'Ville',
    tijd: 'Heure',
    week: 'Sept jours',
    bron: 'Source : Fazilet Takvimi',
    opgehaald: 'relevé',
    meer: 'Toutes les villes et la semaine',
    geen: 'Les heures de prière sont momentanément indisponibles. Réessayez plus tard.',
    fout: "Les heures à jour n'ont pas pu être chargées ; celles du dernier build restent affichées.",
  },
  diensten: [
    {
      titel: 'Heures de prière',
      tekst:
        'Les horaires quotidiens pour Bruxelles et nos sections : imsak, lever du soleil, midi, après-midi, soir et nuit.',
      href: '/namaz-vakitleri',
    },
    {
      titel: 'Prêche du vendredi',
      tekst:
        'Les archives des prêches hebdomadaires, le plus récent en premier, avec le texte et, si disponible, un pdf.',
      href: '/cuma-hutbesi',
    },
    {
      titel: 'Nos sections',
      tekst: 'Nos sections dans toute la Belgique : adresse, téléphone et position sur la carte.',
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
        'Dans nos sections, nous offrons aux enfants et aux jeunes, outre une formation religieuse et morale, un soutien pour les cours scolaires ainsi que des activités sociales et culturelles.',
      href: '/hakkimizda',
    },
    {
      titel: 'Visites de la mosquée',
      tekst:
        'Nous organisons des visites de la mosquée pour les écoles, les institutions et toute personne intéressée. Pour une visite, contactez la section la plus proche.',
      href: '/subelerimiz',
      rol: 'bezoek',
    },
    {
      titel: 'Journée portes ouvertes',
      tekst:
        'Lors de la Journée portes ouvertes annuelle, nous ouvrons nos portes à tous nos voisins et créons un lieu de rencontre et de dialogue.',
      href: '/haberler',
      rol: 'deur',
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
  labelBezoekadres: 'Adresse de visite',
  labelTelefoon: 'Téléphone',
  labelEmail: 'E-mail',
  labelUren: 'Nos heures d’ouverture',
  labelRoute: 'Itinéraire',
  routeTekst: 'Ouvrir dans la carte',
  labelKbo: 'BCE',
  labelRechtspersoon: 'Personne morale',
  labelZetel: 'Siège',
  land: 'Belgique',
  whatsappLabel: 'Écrire sur WhatsApp',
  whatsappAria: 'Ouvrir la conversation WhatsApp',
  juridischNoot:
    'Ce texte juridique a été mis à jour le 19 novembre 2026. Une question ? Écrivez à info@uccib.com.',
  leeg: {
    subelerimiz: {
      titel: 'Les sections sont en cours de complétion',
      tekst:
        'Nous vérifions une à une les adresses et les coordonnées de nos sections. Une adresse erronée est pire qu’un visiteur qui attend un peu. Entre-temps, notre secrétariat vous indique volontiers la section la plus proche.',
    },
    'bolge-derneklerimiz': {
      titel: 'La liste des associations régionales suit',
      tekst:
        'Nous publierons les associations régionales par région, avec leur nom et leurs coordonnées. En attendant cette liste, nous vous aidons volontiers par téléphone.',
    },
    'namaz-vakitleri': {
      titel: 'Le tableau des horaires est en préparation',
      tekst:
        'Nous réunirons les horaires quotidiens dans un seul tableau : imsak, lever du soleil, midi, après-midi, soir et nuit. D’ici là, vous pouvez demander les horaires à nos sections.',
    },
    'cuma-hutbesi': {
      titel: 'Les archives des prêches se constituent',
      tekst:
        'Nous archivons les prêches avec le texte et, si disponible, un pdf, le plus récent en premier. Pour l’instant, les prêches sont donnés dans nos mosquées.',
    },
    haberler: {
      titel: 'La rubrique actualités est en préparation',
      tekst:
        'Nous reconstruisons la rubrique actualités du site. D’ici là, nos annonces et nos activités sont disponibles via la page de contact ou par téléphone.',
    },
    'baharkermesi-menu': {
      titel: 'Le menu du marché de printemps est archivé',
      tekst:
        'Le dernier marché de printemps est terminé. Nous conservons le menu de cette journée comme archive. Dès que l’association fixe la nouvelle date, le nouveau menu paraîtra ici.',
    },
    hakkimizda: {
      titel: 'La page de présentation est en cours de rédaction',
      tekst:
        'Nous réécrivons la page qui présente notre union. D’ici là, notre secrétariat répond volontiers à vos questions par téléphone ou par e-mail.',
    },
    bagislar: {
      titel: 'La page des dons est en préparation',
      tekst:
        'Nous remettons en place les liens de paiement sécurisés. Si vous souhaitez faire un don entre-temps, notre secrétariat vous aide volontiers.',
    },
  },
  nietGevonden: {
    kop: 'Page introuvable',
    lead: 'La page que vous cherchez a peut-être été déplacée ou supprimée.',
    lijstLabel: 'Pages du site',
    beschrijving:
      'La page que vous cherchez n’existe pas ici. Continuez par l’accueil ou l’une des pages ci-dessous.',
  },
  bedankt: {
    beeldAlt:
      'Carte de remerciement en turc de l’UCCIB : un mot de gratitude à toutes celles et ceux qui soutiennent par leurs dons et leur aide l’action de l’UCCIB et les élèves du Coran, conclu par « Teşekkür Ederiz » (nous vous remercions) et « Allah razı olsun » (que Dieu soit satisfait de vous). En bas, le logo de l’UCCIB.',
    terug: 'Retour à la page d’accueil',
    opnieuw: 'Faire un autre don',
  },
  rozetMenuOpen: 'Menu',
  rozetMenuSluit: 'Fermer le menu',
  piekSlagen: ['Derrière chaque service, il y a', 'une section,', 'un bénévole', 'et une porte ouverte.'],
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
