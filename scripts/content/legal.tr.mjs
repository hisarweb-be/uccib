/**
 * De twee juridische teksten van de oude site, één op één overgenomen.
 *
 * Bron: de opgeslagen pagina's van uccib.com (november 2026). Er is geen woord
 * bijgekomen of weggegaan; alleen de opmaak is omgezet naar Portable Text zodat
 * de redactie de tekst later in de Studio kan bijwerken. De koppen die de oude
 * site vet zette, zijn hier koppen, en de ene cursieve regel is cursief gebleven.
 *
 * Dit bestand is een keer omgezet uit de HTML en daarna teken voor teken
 * teruggeteld tegen de bron. Wijzigt de voorzitter de tekst, dan doet ze dat in
 * Sanity, niet hier.
 */
import { cursief, h2, opsomming, p } from '../lib/portable.mjs';

/** Sorumluluk Reddi · de künye-pagina (disclameer). */
export const DISCLAMEER = [
  h2("(1) Sorumluluk Reddi"),
  p("Bu sayfada uccib.com’un “Union des Centres Culturels Islamiques Belgium” tarafından sunulan feragatnameyi bulacaksınız. Bu sorumluluk reddinde, web sitemizdeki bilgileri size hangi rezervasyon altında sunduğumuzu belirtiyoruz."),
  h2("(2) Fikri Mülkiyet"),
  p("Bu web sitesindeki bilgilerin kullanımı, bu bilgileri kopyalamadığınız, dağıtmadığınız veya başka bir şekilde kullanmadığınız veya kötüye kullanmadığınız sürece ücretsizdir. Bu web sitesindeki bilgileri yalnızca zorunlu kanun düzenlemelerine uygun olarak yeniden kullanabilirsiniz."),
  p("“Union des Centres Culturels Islamiques Belgium” nin açık yazılı izni olmadan bu web sitesinde yer alan yazı, fotoğraf veya diğer materyallerin yeniden kullanılması yasaktır. Fikri mülkiyet “Union des Centres Culturels Islamiques Belgium” ye aittir."),
  h2("Doğruluk garantisi yok"),
  cursief("Uygunsa:"),
  p("Web sitemizdeki fiyatlar için, gerçekliğin ve hedeflenen fiyatların mümkün olan en doğru şekilde temsil edilmesi için çaba gösteriyoruz. Programlama veya yazım hataları olarak ortaya çıkan ve fark edilebilen hatalar hiçbir zaman “Union des Centres Culturels Islamiques Belgium” ile bir sözleşme veya anlaşma talep etmek veya üstlenmek için bir neden oluşturmaz."),
  p("Union des Centres Culturels Islamiques Belgium, olabildiğince güncel bir web sitesi için çalışmaktadır. Bu çabalara rağmen, bu web sitesindeki bilgiler veya içerik eksik ve / veya yanlışsa, bunun için herhangi bir sorumluluk kabul edemeyiz."),
  p("Bu web sitesinde yer alan bilgiler ve / veya ürünler herhangi bir garanti ve / veya doğruluk iddiası olmaksızın sunulmaktadır. Bu malzemeleri önceden haber vermeksizin değiştirme, kaldırma veya yeniden yayınlama hakkımızı saklı tutuyoruz. “Union des Centres Culturels Islamiques Belgium”, hiper bağlantılarla atıfta bulunduğumuz web sitelerinde yer alan hiçbir bilgi için sorumluluk kabul etmez."),
  h2("Değişiklikler"),
  p("Bu feragatnamenin değişmesi durumunda, uccib.com feragatnamesinin en son sürümünü bu sayfada bulacaksınız."),
];

/** Çerez Politikası · cookiebeleid, secties (1) tot en met (8.6.2). */
export const CEREZ = [
  h2("Genel"),
  p("Kayıtlı ofisi “rue charles demeer” adresinde bulunan “Union des Centres Culturels Islamiques Belgium”, (bundan sonra BTW BE 0843.891.981 olarak anılacaktır) kayıtlı ve işlemden “Kar amacı gütmeyen dernek” türü sorumludur. Kişisel verilerinizin www.uccib.com web sitesinde yer alması."),
  h2("(2) Toplanan kişisel veriler"),
  h2("(2.1) Bize sağladığınız veriler"),
  p("Web sitesindeki iletişim ve teklif formunda:"),
  opsomming([
    "İsim",
    "Soyadı",
    "Telefon numarası",
    "Şirket Adı BTW numarası veya işletme numarası",
  ]),
  h2("(2.2) Otomatik olarak kaydedilen veriler:"),
  p("Bazı veriler çerezler aracılığıyla toplanır: Çerez Politikamız için bu belgenin altına bakınız."),
  p("Çerezlerde saklanmadan da belirli veriler toplanabilir. Sadece “Union des Centres Culturels Islamiques Belgium” tarafından ve sadece web sitesini ziyaretiniz sırasında okunabilirler. Bu şu konularla ilgilidir: 1 °) TCP / IP adresi 2 °) web tarayıcınızın türü ve sürümü 3 °) en son ziyaret edilen internet sayfası."),
  h2("(2.3) Ticari ortaklar tarafından iletilen kişisel veriler"),
  p("Bu hipotezde, “Union des Centres Culturels Islamiques Belgium” nin “Union des Centres Culturels Islamiques Belgium” ye ticari ortakları, ticari ortakların ilgili kişisel verilerin aktarılması için izin aldıklarını garanti etmektedir."),
  h2("(3) İşlemenin amaçları"),
  h2("(3.1) Genel amaçlar"),
  p("Kişisel verileriniz şu amaçlarla toplanır:"),
  p("www.uccib.com adresinde sunulan hizmeti sizlere sunmak için;"),
  p("www.uccib.com’un teknik ve içerik kalitesini iyileştirmek için pazar araştırması yapmak."),
  p("Bilgi sağlamak, ilginizi çekebilecek çeşitli teklifler içeren bir e-posta göndermek;"),
  p("www.uccib.com’un teknik idaresini yönetmek için;"),
  p("Verilerin anonim hale getirilmesinden sonra, www.uccib.com’un farklı bölümlerinin ziyaret sayılarına ilişkin istatistiklerin derlenmesi veya anketlerin yapılması."),
  h2("(3.2) Doğrudan pazarlama ve üçüncü şahıslara iletişim"),
  p("“Union des Centres Culturels Islamiques Belgium” kayıt olurken bunun için önceden açık onayınızı (“dahil etme”) almadıkça, kesinlikle gizli tutulacak ve hiçbir koşulda üçüncü şahıslara iletilmeyecek veya doğrudan pazarlama amacıyla kullanılmayacaktır."),
  p("Bu onay, herhangi bir motivasyon olmaksızın ve ücretsiz olarak contact@uccib.com adresine e-posta gönderilerek geri çekilebilir."),
  h2("(4) Verilerin saklanma süresi"),
  p("Tüm kişisel veriler, “Union des Centres Culturels Islamiques Belgium” tarafından hizmetin sunulması için gerekli süre boyunca saklanır."),
  h2("(5) Erişim ve düzeltme hakkı"),
  p("Kişisel verilerinizi dilediğiniz zaman contact@uccib.com adresine e-posta göndererek veya işbu Gizlilik Politikası’nın 1. Maddesindeki adrese mektupla ücretsiz olarak inceleme, düzeltme veya değiştirme hakkına sahipsiniz. ."),
  p("Kişisel verilerinizi “Union des Centres Culturels Islamiques Belgium” ye iletip iletmeme konusunda tamamen özgürsünüz. İletişim / sipariş formuna kişisel verilerinizi girmediğiniz takdirde bazı hizmetlerin reddedilebileceğini ve “Union des Centres Culturels Islamiques Belgium” ye verdiğiniz bilgilerin doğruluğundan yalnızca sizin sorumlu olduğunuzu bilmelisiniz."),
  h2("(6) İtiraz hakkı"),
  p("Kişisel verilerinizin ciddi ve meşru sebeplerle işlenmesine itiraz etme hakkınızı contact@uccib.com adresine e-posta göndererek kullanabilirsiniz. Ancak, sözleşmeden doğan yükümlülüklerin yerine getirilmesi için gerekliyse, kişisel verilerinizin işlenmesine itiraz edemezsiniz."),
  h2("(7) Güvenlik ve gizlilik"),
  p("“Union des Centres Culturels Islamiques Belgium” üzerinde toplanan kişisel verilerin imha edilmesini, kaybolmasını, tahrif edilmesini, değiştirilmesini, yetkisiz erişimini veya yanlışlıkla üçüncü kişilere bildirilmesini önlemek için teknik ve organizasyonel düzeyde uyarlanmış güvenlik önlemleri geliştirmiştir. bu verilerin başka herhangi bir yetkisiz işlenmesinden kaçının. Kişisel verilerin üçüncü kişiler tarafından yanlış veya hukuka aykırı kullanımından kaynaklanan doğrudan veya dolaylı zararlardan hiçbir şekilde “Union des Centres Culturels Islamiques Belgium” sorumlu tutulamaz."),
  p("“Union des Centres Culturels Islamiques Belgium”, web sitesinde “Union des Centres Culturels Islamiques Belgium” nin kontrol etmediği ve bu Gizlilik Politikası’nın geçerli olmadığı başka sitelere bağlantılar, hiper bağlantılar veya referanslar içerebileceği konusunda sizi uyarmak ister. Nitekim bu siteler “Union des Centres Culturels Islamiques Belgium” tarafından yönetilmiyor. “Union des Centres Culturels Islamiques Belgium”, atıfta bulunulan bu tür web sitelerinin içeriğinden ve bu sitelerde adı geçen teklif, ürün veya hizmetlerden sorumlu değildir. Bu nedenle, “Union des Centres Culturels Islamiques Belgium”, bu Gizlilik Politikasından farklı olabileceğinden, ziyaret ettiğiniz her sitenin her gizlilik politikasını dikkatlice okumanızı tavsiye eder."),
  h2("(8) Çerezler"),
  h2("(8.1) Çerez kullanımımız hakkında bilgiler"),
  p("“Union des Centres Culturels Islamiques Belgium”, kullanım tercihlerinizi web sitemizin diğer kullanıcılarından ayırt etmek için tanımlama bilgileri ve benzer teknolojileri kullanır. Bu, web sitemizi ziyaret ettiğinizde size daha iyi bir kullanıcı deneyimi sunmamıza yardımcı olur ve ayrıca web sitemizi optimize etmemizi sağlar."),
  p("Ancak çerezler ve benzeri teknolojiler, www.uccib.com’un kullanıcılarını tanımlayabilecek verilerin sistematik olarak toplanmasına izin vermez. Yalnızca web sitemizin çalışma şeklini iyileştirmemize, kullanıcılarımızın ilgi alanlarını anlamamıza ve web sitemizin içeriğinin ne kadar etkili olduğunu ölçmemize yardımcı olurlar."),
  p("Yakın zamanda yapılan yasal değişikliklerin bir sonucu olarak, Avrupa Birliği’nin belirli bölümlerini hedefleyen tüm web sitelerinin, bilgisayarlarınızda veya mobil cihazlarınızda tanımlama bilgileri ve benzer teknolojileri kullanmak veya saklamak için sizden izin istemesi gerekmektedir. Bu çerez politikası, kullandığımız çerezler ve bunların amaçları hakkında size açık ve eksiksiz bilgi verir. Web sitesi için geçerli olan gizlilik kuralları hakkında bilgi edinmek için lütfen Gizlilik Politikamızı okuyun."),
  p("Bu Çerez Politikası hakkında daha fazla bilgi için bizimle contact@uccib.com adresinden iletişime geçebilirsiniz."),
  h2("(8.2) Çerez nedir?"),
  p("Çerez, tarayıcınızda veya bilgisayarınızın sabit diskinde sakladığımız küçük bir metin ve sayı dosyasıdır. Bu şekilde Web Sitemizi kullanırken tercihlerinizi hatırlayabiliriz."),
  p("www.uccib.com’u ziyaret ettiğinizde, kullandığımız farklı çerez kategorilerini yerleştirmek için izniniz istenecektir."),
  h2("(8.3) Çerez türleri"),
  p("Çerezler kökenlerine, işlevlerine ve ömürlerine göre bölünebilir."),
  p("(8.3.1) Birinci taraf çerezler, kullanıcı tarafından halihazırda ziyaret edilen bir web sitesi tarafından yerleştirilen çerezlerdir (örneğin, uccib.com tarafından yerleştirilen çerezler)."),
  p("(8.3.2) Üçüncü taraf çerezleri, kullanıcı tarafından ziyaret edilen web sitesi dışındaki bir alan adı tarafından yerleştirilen çerezlerdir. Bir kullanıcı bir web sitesini ziyaret ederse ve bir üçüncü şahıs bu web sitesi aracılığıyla bir çerez yerleştirirse, bu üçüncü taraf bir çerezdir (ör. Google, Twitter ve Facebook tarafından yerleştirilen çerezler)."),
  p("(8.3.3) İşlevsel çerezler, web sitesinin düzgün bir şekilde çalışmasını sağlayan çerezlerdir (örneğin, oturum açma veya kayıt için çerezler, dil tercihleri). İşlevsel tanımlama bilgileri, mantıksal olarak birinci taraf tanımlama bilgileridir."),
  p("(8.3.4) İşlevsel olmayan çerezler, istatistiksel, sosyal, hedefleme ve ticari amaçlarla yerleştirilebilen çerezlerdir. Web sitesinin tamamen teknik desteği ile hiçbir ilgisi yoktur. Statik amaçlı çerezler, web sitesinin hangi sayfalarını ziyaret ettiğinizi, bilgisayarınızın nerede olduğunu vb. Kontrol etmenizi sağlar. Sosyal amaçlı çerezler, kullanıcının ziyaret ettiği web sitesinin içeriğini sosyal medya aracılığıyla doğrudan başkalarıyla paylaşmasını sağlar. Hedefleme amaçlı çerezler, gezinme davranışınıza göre bir profil oluşturulmasına izin verir, böylece görüntülenen reklamlar ilgi alanlarınıza göre uyarlanır. Ticari amaçlı çerezler, bir kullanıcıya kaç tane ve hangi reklamların gösterildiğini takip eder. İşlevsel olmayan tanımlama bilgileri birinci taraf veya üçüncü taraf tanımlama bilgileri olabilir."),
  p("(8.3.5) Kalıcı çerezler: Bu çerezler, çerezde belirtilen süre boyunca kullanıcının cihazında kalır. Kullanıcı bu çerezi yerleştiren web sitesini her ziyaret ettiğinde etkinleştirilirler (ör. Twitter, Facebook, Google Analytics vb. Sosyal medya tarafından yerleştirilen çerezler). İşlevsel olmayan çerezlerin çoğu kalıcı çerezlerdir."),
  p("(8.3.6) Oturum çerezleri: Bu çerezler, bir kullanıcının eylemlerini basitleştirmemize ve bir tarayıcı oturumu sırasında onları birbirine bağlamamıza izin verir. Bir tarayıcı oturumu, bir kullanıcı tarayıcı ekranını açtığında başlar ve tarayıcı ekranını kapattığında sona erer. Oturum çerezleri geçici olarak yerleştirilir. Tarayıcıyı kapatır kapatmaz tüm oturum çerezleri silinir. İşlevsel tanımlama bilgilerinin çoğu, oturum tanımlama bilgileridir."),
  h2("(8.4) Onayınız"),
  p("Web sitemizi kullanarak çerez kullanımını kabul etmiş olursunuz. Web sitemizi en iyi şekilde kullanmak için, tarayıcı ayarlarınız aracılığıyla yapabileceğiniz bu çerezleri kabul etmelisiniz."),
  p("Çerezlerin yerleştirilmesini reddetmenize izin veren tarayıcı ayarını etkinleştirerek çerezleri engellersiniz. Ancak, bu çerezleri engellemek için tarayıcı ayarlarınızı kullanırsanız, Web Sitemize (belirli bölümlerine) erişemeyebilirsiniz. Bununla ilgili daha fazla bilgi için bu çerez politikasını dikkatlice okuyun."),
  p("Onayınızı herhangi bir zamanda geri çekmek isterseniz, çerezlerinizi şu yollarla silmelisiniz: tarayıcı ayarlarınız. Çerezlerin kaldırılması veya engellenmesi hakkında daha fazla bilgi için, şu web sitesini ziyaret edebilirsiniz: http://www.aboutcookies.org/Default.aspx?page=2."),
  h2("(8.5) Tarayıcı ayarlarınızı değiştirin"),
  p("Web tarayıcılarının çerez ayarlarınızı değiştirmenize izin verdiğini belirtiyoruz. Bu ayarlar genellikle web tarayıcınızın “Seçenekler” veya “Tercihler” menüsünde bulunabilir. Bu ayarları daha iyi anlamak için aşağıdaki bağlantılar yardımcı olabilir. Değilse, daha fazla ayrıntı için web tarayıcınızın “Yardım” işlevine başvurmalısınız."),
  p("Internet Explorer’da tanımlama bilgisi ayarları"),
  p("Firefox’ta çerez ayarları"),
  p("Chrome’da çerez ayarları"),
  p("Safari’de çerez ayarları"),
  h2("(8.6) Çerezler hakkında daha fazla bilgi"),
  p("Çerezlerle ilgili bilgiler"),
  p("Çerezler hakkında yararlı bilgileri burada bulabilirsiniz: http://www.allaboutcookies.org/"),
  p("İnternet Reklamcılığı Bürosu"),
  p("Dijital pazarlamacıların ilgi grubu, burada bulabileceğiniz çevrimiçi davranışsal reklamcılık ve çevrimiçi gizlilik için bir kılavuz hazırladı: http://www.youronlinechoices.eu/."),
  h2("(8.6.1) Geçerli yasa ve yargı yetkisi maddesi"),
  p("Bu Gizlilik Politikası, herhangi bir ihtilafta münhasıran geçerli olan Belçika yasalarına göre yönetilir, yorumlanır ve yürütülür."),
  p("Anvers yargı bölgesinin mahkemeleri, bu Gizlilik Politikasının yorumlanmasından veya uygulanmasından doğabilecek herhangi bir anlaşmazlığı karara bağlamak için münhasır yargı yetkisine sahiptir."),
  p("(8.6.2) Kabul Web sitesini ziyaret etmekle ve en geç sipariş verdiğiniz anda işbu Gizlilik Politikası’nın tüm hükümlerini kabul etmiş ve “Union des Centres Culturels Islamiques Belgium” nin kişisel verilerinizi bu Gizlilik Politikası uyarınca toplayıp işleyeceğini kabul etmiş olursunuz."),
];
