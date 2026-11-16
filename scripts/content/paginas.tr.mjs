/**
 * De veertien pagina's van uccib.com, Turks, één op één overgenomen.
 *
 * Bron: de opgeslagen pagina's van de oude site (`D:\tmp\win\uccib-analyse`,
 * `home2.txt`, `p-*.txt`). Er is geen zin bijgekomen en geen zin weggegaan.
 * Waar de oude site niets had, staat hier niets: `hizmetlerimiz`, `iletisim` en
 * `bagislar` hebben alleen een kop, want dat is alles wat er stond. De negen
 * bedragen op `/bagislar/` horen niet in proza maar in `sponsorblok`-documenten,
 * waar F5 ze ophaalt.
 *
 * `titel`, `h1` en `seo` komen uit `src/i18n/tr.json`: dat is het contract dat
 * F0/F1 heeft vastgelegd en dat de keuringspoort leest. Wijkt de oude pagina af
 * (op `/hakkimizda/` was de h1 de welkomstzin), dan wint het contract en wordt
 * de oude tekst een kop in de body.
 *
 * De `_key` van elk blok komt uit `sleutels()`, zodat dezelfde bron altijd
 * dezelfde JSON oplevert en een commit geen ruis bevat.
 */
import {
  afbeelding,
  h2,
  h3,
  linkParagraaf,
  p,
  sleutels,
} from '../lib/portable.mjs';
import { CEREZ, DISCLAMEER } from './legal.tr.mjs';

/**
 * Afbeeldingen: de oude site had overal `alt=""`, wat het schema niet toestaat.
 * De alt-tekst hieronder beschrijft daarom feitelijk wat het beeld is, volgens
 * de notitie in `public/beeld/manifest.json`; er is niets verzonnen over wat er
 * op het beeld staat.
 *
 * `asset._ref` is in deze bron een pad in `public/`. `import-sanity.mjs --apply`
 * uploadt dat bestand en vervangt de verwijzing door een echte asset-referentie;
 * de fallback leest het pad rechtstreeks.
 */
const DANK = '/beeld/dank-donatie/960.webp';
const AFFICE = '/beeld/logo/uccib-affice/960.webp';
const MENUKAART = '/beeld/menukaart-bahar-kermesi/960.webp';

/** @type {Record<string, {titel: string, h1: string, intro?: string, volgorde: number, body: unknown[], seo: {titel: string, beschrijving: string}}>} */
export const PAGINAS = {
  '': {
    titel: 'UCCIB — İslam Kültür Merkezleri Birliği',
    h1: 'Union des Centres Culturels Islamiques Belgium',
    intro: 'Belçika İslam Kültür Merkezleri Birliği Vakfı',
    volgorde: 0,
    body: sleutels([
      h2('UCCİB - İslam Kültür Merkezleri Birliği Sitesine Hoşgeldiniz.'),
      p(
        'Web Sitemize Hoşgeldiniz. İslam Kültür Merkezleri Birliği’ne ilginizden dolayı teşekkür ederiz. Umuma hadim ve dini cemaat statüsüne sahip olan bir dernek olarak dini, sosyal ve kültürel alanlarda hizmet vermekteyiz. Belçika’da yaşayan müslümanlara hususiyetle dini konularda kapsamlı bir şekilde yardımcı olmaktayız. Ayrıca toplumsal dayanışma ve barış içerisinde yaşama hususunda destek vermekteyiz.'
      ),
      linkParagraaf('Hakkımızda →', '/hakkimizda'),
      h2('Güncel & Basın'),
      p('Yakında haberler burada yayınlanacaktır.'),
      linkParagraaf('Tüm Güncel', '/haberler'),
      h2('Sosyal Faaliyetlerimiz'),
      linkParagraaf('Namaz Vakitleri', '/namaz-vakitleri'),
      linkParagraaf('Hutbe', '/cuma-hutbesi'),
      linkParagraaf('Şubelerimiz', '/subelerimiz'),
      linkParagraaf('Bağış', '/bagislar'),
      h3('Eğitim ve Gençlik Hizmetleri'),
      p(
        'Şubelerimizde çocuklarımıza ve gençlerimize dini ve ahlaki eğitimin yanı sıra okul derslerine destek, sosyal ve kültürel faaliyetler sunmaktayız.'
      ),
      linkParagraaf('Daha fazla bilgi', '/hakkimizda'),
      h3('Cami Tanıtım Programları'),
      p(
        'Okullar, kurumlar ve ilgilenen herkes için cami ziyaretleri düzenliyoruz. Ziyaretler için en yakın şubemizle iletişime geçebilirsiniz.'
      ),
      linkParagraaf('Şubelerimiz için buraya tıklayınız!', '/subelerimiz'),
      h3('Açık Cami Günü'),
      p(
        'Her yıl düzenlenen Açık Cami Günü’nde kapılarımızı tüm komşularımıza açıyor, tanışma ve diyalog ortamı oluşturuyoruz.'
      ),
      linkParagraaf('Daha fazla bilgi için tıklayınız!', '/haberler'),
    ]),
    seo: {
      titel: 'UCCIB — İslam Kültür Merkezleri Birliği',
      beschrijving:
        'UCCIB, Belçika İslam Kültür Merkezleri Birliği Vakfı. 1979’dan beri Belçika’da dini, sosyal ve kültürel hizmetler.',
    },
  },

  hakkimizda: {
    titel: 'Hakkımızda',
    h1: 'Hakkımızda',
    volgorde: 1,
    body: sleutels([
      h2('UCCİB - İslam Kültür Merkezleri Birliği Sitesine Hoşgeldiniz.'),
      p(
        'İslam Kültür Merkezleri Birliği 1979 senesinde Brüksel’de kurulmuş dini cemaat statüsüne sahip bir İslami teşkilattır. Bağımsız, partiler üstü ve umuma hadimdir. Derneğin amacı, Belçika’da yaşayan Müslümanlara dini, sosyal ve kültürel alanlarda kapsamlı hizmetler sunmaktır. Bir diğer temel görev ise, İslam’ın ve Müslümanların Avrupa toplumunun birer parçası olarak kabul edilmeleri ve kültürlerarası iletişimin sağlanmasıdır. Bu amaçla UCCİB, Federal Belçika Devleti’nde belediye, eyalet ve federal düzeyde birçok dini, sosyal ve devlet kurumuyla ortak çalışmalarda bulunmaktadır.'
      ),
    ]),
    seo: {
      titel: 'Hakkımızda',
      beschrijving:
        '1979’da Brüksel’de kurulan UCCIB Vakfı: bağımsız, partiler üstü, belediye, il ve federal yönetimlerle iş birliği içinde.',
    },
  },

  // Alleen een kop: de oude pagina had geen tekst.
  hizmetlerimiz: {
    titel: 'Hizmetlerimiz',
    h1: 'Hizmetlerimiz',
    volgorde: 2,
    body: [],
    seo: {
      titel: 'Hizmetlerimiz',
      beschrijving:
        'UCCIB’nin yedi hizmeti: namaz vakitleri, cuma hutbesi, şubeler, bağış, eğitim ve gençlik, cami tanıtım programları ve açık cami günü.',
    },
  },

  haberler: {
    titel: 'Güncel & Basın',
    h1: 'Güncel & Basın',
    volgorde: 3,
    body: sleutels([
      p(
        'Birliğimizle ilgili en güncel haberleri, duyuruları ve basın bildirilerini bu sayfada bulabilirsiniz.'
      ),
      p('Bu kategoride henüz haber bulunmuyor.'),
    ]),
    seo: {
      titel: 'Güncel & Basın',
      beschrijving: 'UCCIB’den haberler ve basın açıklamaları, en yenisi başta.',
    },
  },

  // Alleen een kop: de oude pagina had geen tekst. Adres en bereikbaarheid
  // staan in `instellingen` en verschijnen via het voettekst- en contactblok.
  iletisim: {
    titel: 'İletişim',
    h1: 'İletişim',
    volgorde: 4,
    body: [],
    seo: {
      titel: 'İletişim',
      beschrijving:
        'UCCIB iletişim: Rue Charles Demeer 3, 1020 Brüksel. Telefoon, e-posta, WhatsApp ve yol tarifi.',
    },
  },

  // Alleen een kop: de bedragen zijn sponsorblokken, geen proza.
  bagislar: {
    titel: 'Bağış',
    h1: 'Bağış',
    volgorde: 5,
    body: [],
    seo: {
      titel: 'Bağış',
      beschrijving:
        'UCCIB’ye bağış yapın: 5, 10, 25, 50, 100, 250, 500 ve 1.000 euro ya da kendi tutarınız. Dini, sosyal ve kültürel hizmetler için.',
    },
  },

  'bagis-onayi': {
    titel: 'Bağış Onayı',
    h1: 'Bağış Onayı',
    volgorde: 6,
    body: sleutels([afbeelding(DANK, 'Teşekkür görseli')]),
    seo: {
      titel: 'Bağış Onayı',
      beschrijving:
        'Bağışınız için teşekkür ederiz. Desteğiniz UCCIB’nin dini, sosyal ve kültürel hizmetlerini mümkün kılıyor.',
    },
  },

  subelerimiz: {
    titel: 'Şubelerimiz',
    h1: 'Şubelerimiz',
    volgorde: 7,
    body: sleutels([
      p(
        'Belçika genelindeki şubelerimizin adres ve iletişim bilgileri yakında burada yer alacaktır.'
      ),
    ]),
    seo: {
      titel: 'Şubelerimiz',
      beschrijving: 'UCCIB şubeleri: adres, telefon ve harita üzerinde konum.',
    },
  },

  'bolge-derneklerimiz': {
    titel: 'Bölge Derneklerimiz',
    h1: 'Bölge Derneklerimiz',
    volgorde: 8,
    body: sleutels([
      p(
        'Belçika’daki bölge derneklerimizin listesi yakında burada yer alacaktır.'
      ),
    ]),
    seo: {
      titel: 'Bölge Derneklerimiz',
      beschrijving: 'UCCIB bölge dernekleri, bölgeye göre gruplanmış.',
    },
  },

  'namaz-vakitleri': {
    titel: 'Namaz Vakitleri',
    h1: 'Namaz Vakitleri',
    volgorde: 9,
    body: sleutels([
      p(
        'Brüksel ve Belçika şehirleri için namaz vakitleri yakında burada yer alacaktır.'
      ),
    ]),
    seo: {
      titel: 'Namaz Vakitleri',
      beschrijving:
        'Brüksel için günlük namaz vakitleri: imsak, güneş, öğle, ikindi, akşam ve yatsı.',
    },
  },

  'cuma-hutbesi': {
    titel: 'Cuma Hutbesi',
    h1: 'Cuma Hutbesi',
    volgorde: 10,
    body: sleutels([p('Haftalık Cuma hutbelerimiz burada yayınlanacaktır.')]),
    seo: {
      titel: 'Cuma Hutbesi',
      beschrijving:
        'Cuma hutbeleri arşivi, en yeni hutbe başta, her hutbe için metin ve isteğe bağlı pdf.',
    },
  },

  disclameer: {
    titel: 'Künye',
    h1: 'Künye',
    volgorde: 11,
    body: sleutels(DISCLAMEER),
    seo: {
      titel: 'Künye',
      beschrijving: 'UCCIB künye, sorumluluk reddi ve yayın bilgileri.',
    },
  },

  'cerez-politikasi-cookie-policy': {
    titel: 'Çerez Politikası',
    h1: 'Çerez Politikası',
    volgorde: 12,
    body: sleutels(CEREZ),
    seo: {
      titel: 'Çerez Politikası',
      beschrijving:
        'Bu site çerez kullanmaz. Bu sayfa hangi verilerin işlendiğini ve hangilerinin işlenmediğini açıklar.',
    },
  },

  'baharkermesi-menu': {
    titel: 'Bahar Kermesi Menü',
    h1: 'Bahar Kermesi Menü',
    volgorde: 13,
    // Volgorde van de oude pagina: eerst het logo, dan de menukaart.
    body: sleutels([
      afbeelding(AFFICE, 'UCCIB logosu'),
      afbeelding(MENUKAART, 'Bahar Kermesi menükaartı'),
    ]),
    seo: {
      titel: 'Bahar Kermesi Menü',
      beschrijving: 'Bahar kermesinin menüsü ve fiyatları.',
    },
  },
};
