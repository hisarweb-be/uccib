# UCCIB web sitesi: kullanım kılavuzu

Bu kılavuz UCCIB yönetimi için yazıldı. Teknik bilgi gerekmez. Her adım sırayla yapılır.

Yazan: HisarWeb, 19 Kasım 2026. Sürüm 1.1.

Sürüm 1.1: adres, açılış saatleri, KBO numarası ve konum için **Kerngegevens** bölümü eklendi (bölüm 5).

---

## 1. Önce şunu bilin

Sitenin adresi: **https://uccib.pages.dev**

Yönetim (düzenleme) ekranı: **https://uccib.pages.dev/admin/**

Bu ekranda yaptığınız her değişiklik **hemen kaydedilir** ve site **2 dakika içinde** kendiliğinden güncellenir. Ayrıca bir
program kurmanız, dosya göndermeniz veya bizi aramanız gerekmez.

Önemli: `uccib.com` adresi şu an eski siteyi gösteriyor. Yeni site `uccib.pages.dev` adresinde çalışıyor. Alan adı
taşındığında bu kılavuzdaki adresler `uccib.com` olarak değişecek; yapılan işlemler aynı kalacak.

---

## 2. Giriş yapmak

1. Tarayıcıyı açın (Chrome, Edge veya Safari).
2. Adres çubuğuna şunu yazın: `https://uccib.pages.dev/admin/`
3. Ekranda iki seçenek çıkar:
   - **Sign In with GitHub** (önerilen)
   - **Sign In Using Access Token** (yedek yol)
4. **Sign In with GitHub** düğmesine basın. Küçük bir pencere açılır; kendi GitHub hesabınızla giriş yaparsınız.
   Bir kez yapılır: sonraki girişlerde tarayıcı sizi hatırlar. Token yazmanız gerekmez.
5. Giriş yaptıktan sonra sol tarafta menü görünür: **Sayfalar**, **Bağış tutarları**, **Şubeler**, **Bölge dernekleri**,
   **Namaz vakitleri**, **Cuma hutbeleri**, **Kerngegevens**.

   Bazı başlıkların yanında parantez içinde Felemenkçe bir kelime görünür (örnek: "Şubeler (vestigingen)"). Bu yalnızca
   menünün iç adıdır, sizi ilgilendirmez. Parantezden önceki Türkçe ad geçerlidir.

GitHub düğmesi bir gün çalışmazsa: **Sign In Using Access Token** yolunu kullanın. Size bir kez verilen uzun harf
dizisini kutuya yapıştırırsınız. Token bir şifre gibidir, kimseyle paylaşılmaz.

Önemli: giriş yaptığınız GitHub hesabının `hisarweb-be/uccib` deposunda **yazma yetkisi** olmalıdır. Bu yetki bir kez
verilir; kimin gireceğini bize iletin, yetkiyi biz veririz.

---

## 3. Bir sayfadaki yazıyı değiştirmek

Örnek: "Hakkımızda" sayfasındaki metni değiştirmek.

1. Soldaki menüden **Sayfalar**'a tıklayın.
2. Listede **Hakkımızda** satırına tıklayın.
3. Sağ tarafta alanlar görünür:
   - **Sekme başlığı**: tarayıcı sekmesinde görünen kısa ad.
   - **Sayfanın büyük başlığı**: sayfanın en üstündeki büyük yazı.
   - **Google için açıklama**: arama motorunda görünen 1-2 cümle.
   - **Giriş metni**: başlığın altındaki kısa tanıtım (boş bırakılabilir).
   - **Sayfa içeriği**: asıl metin. Buradaki yazı normal bir metin kutusu gibi çalışır.
4. Değiştirmek istediğiniz yere tıklayın, yazın veya silin.
5. Sağ üstteki **Save** (kaydet) düğmesine basın.
6. "Kaydedildi" mesajını görürsünüz. 2 dakika bekleyin, siteyi yenileyin: değişiklik yerindedir.

Yanlış yaptıysanız: sayfayı yenilemeden önce **kaydetmeyin**, sayfayı kapatın. Kaydettikten sonra pişman olursanız 10.
bölüme bakın (geri alma).

---

## 4. Bir sayfayı açmak veya kapatmak

Bazı sayfalar hazır ama kapalı duruyor (örnek: Şubelerimiz, Namaz vakitleri, Cuma hutbeleri, Haberler). İçeriği
doldurduğunuzda açarsınız.

1. **Sayfalar** menüsüne gidin.
2. İlgili sayfayı açın (örnek: **Şubelerimiz**).
3. **Yayında** anahtarını **açık** konuma getirin (yeşil).
4. **Save**'e basın.
5. Sayfa 2 dakika içinde menüde ve sitede görünür.

Kapatmak için aynı anahtarı kapatın ve kaydedin. Sayfa silinmez, sadece görünmez olur.

Not: **Yayında** anahtarı üç dil için birdendir. Bir kez açarsınız, Türkçe, Felemenkçe ve Fransızca sayfa birlikte açılır.

---

## 5. Şube (dernek) eklemek

1. Soldaki menüden **Şubeler**'e tıklayın.
2. Sağ üstte **Add Şube** (yeni ekle) düğmesine basın.
3. Alanları doldurun:
   - **Şubenin adı** (zorunlu)
   - **Sokak ve numara**, **Posta kodu**, **Şehir**
   - **Telefon**, **E-posta**
   - **Açılış saatleri** (serbest yazı, örnek: "Her gün 10:00 - 18:00")
   - **Fotoğraf**: bilgisayarınızdan veya telefonunuzdan bir fotoğraf seçin. Sistem fotoğrafı kendisi küçültür ve siteye koyar.
   - **Sıra numarası**: listede nerede görünsün. Küçük sayı önce gelir (1, 2, 3...).
   - **Enlem** ve **Boylam** (isteğe bağlı): şubenin haritadaki yeri. Boş bırakırsanız "Yol tarifi" bağlantısı
     adresten yapılır, bu da yeterlidir. Doldurmak isterseniz: Google Maps'te şubeye sağ tıklayın, çıkan iki sayıyı
     kopyalayın. Enlem -90 ile 90, boylam -180 ile 180 arasında olmalıdır.
   - **Yayında**: açık bırakın.
4. **Save**'e basın.

Aynı yöntem **Bölge dernekleri** için de geçerlidir; orada ayrıca **Bölge veya şehir**, **Kısa tanıtım**,
**İlgili kişi** (ad ve telefon) ve **Web sitesi** (https:// ile başlayan tam adres) alanları vardır. Enlem ve boylam orada da isteğe
bağlıdır.

**Namaz vakitleri** ve **Cuma hutbeleri** ayrı bölümlerdedir: aylık çizelge veya hutbe metni eklenir. Cuma hutbesinde
ayrıca **PDF** yükleyebilirsiniz: PDF düğmesine basıp dosyayı seçin.

---

## 5b. Adres, açılış saatleri ve KBO: Kerngegevens

Soldaki menüde **Kerngegevens** satırı, sitenin her yerinde görünen ortak bilgileri toplar. Bir kez doldurursunuz,
ana sayfa ve iletişim sayfası kendiliğinden güncellenir.

1. Menüden **Kerngegevens**'e tıklayın.
2. Alanlar:
   - **Açılış saatleri**: serbest yazı, örnek "Pazartesi - Cuma 09:00 - 17:00".
   - **KBO numarası**: şirket numarası, örnek 0123.456.789. Boş bırakılırsa sitede görünmez.
   - **Hukuki şekil**: Felemenkçe yazılır (örnek "Vereniging zonder winstoogmerk"). Resmî belgede nasıl yazıyorsa
     öyle bırakın.
   - **Enlem** ve **Boylam**: merkez binanın haritadaki yeri, isteğe bağlı.
3. **Save**'e basın.

Kural: bir alanı boş bırakırsanız o bilgi sitede hiç görünmez. Yanlış bilgi yazmaktansa boş bırakmak daha iyidir.

---

## 6. Fotoğraf değiştirmek veya eklemek

1. Fotoğraf alanına tıklayın, **Choose an image** (görsel seç) düğmesine basın.
2. Bilgisayarınızdan veya telefonunuzdan fotoğrafı seçin.
3. Yükleme bitene kadar bekleyin (birkaç saniye).
4. **Save**'e basın.

Dikkat: fotoğrafın çok büyük olmasına gerek yok, telefonla çekilmiş bir fotoğraf yeterlidir. Ancak **yatay** (enine)
fotoğraflar sitede daha iyi görünür.

---

## 7. Bağış tutarlarını değiştirmek

1. Menüden **Bağış tutarları**'na gidin.
2. Bir satıra tıklayın.
3. **Tutar (€)** alanını değiştirin. Boş bırakırsanız "serbest tutar" olur.
4. **Düğmede görünen yazı**: bağış düğmesinin üzerindeki yazı (örnek: "50 € bağış yap").
5. **Mollie ödeme bağlantısı**: ödeme sayfasının adresi. Buraya dokunmayın, yalnızca Mollie'de yeni bir bağlantı
   oluşturduğunuzda değişir.
6. **Save**'e basın.

---

## 8. Metin yazarken dikkat edilecek kurallar

- **Başlıkları büyük harfle yazmayın.** Site başlıkları kendi biçimlendirir.
- Kısa cümleler kullanın. Uzun paragraflar telefonda okunmaz.
- Bir metni vurgulamak için `**kalın**` yazabilirsiniz; ancak bir sayfada en fazla bir iki yerde kullanın.
- Bağlantı vermek için: `[görünen yazı](https://adres.com)` biçimini kullanın.
- Madde listesi için satırın başına `-` ve bir boşluk koyun.
- Türkçe karakterleri normal klavyeyle yazın (ç, ğ, ı, İ, ö, ş, ü). Sistem bunları doğru gösterir.
- Metnin sonunda mutlaka bir nokta, soru işareti veya iki nokta olsun.

---

## 9. Üç dil

Site üç dilde çalışır: **Türkçe**, **Felemenkçe (nl)**, **Fransızca (fr)**.

Bir sayfayı açtığınızda üstte dil seçimi görünür (tr / nl / fr). Türkçe metni değiştirdiğinizde diğer diller
kendiliğinden değişmez. Felemenkçe ve Fransızca metinleri de güncellemek için aynı sayfada dil seçimini değiştirin ve
o dilin metnini yazın.

Kısa yol: yeni bir metin yazamıyorsanız o dil için aynı Türkçe metni bırakabilirsiniz; ancak Felemenkçe ve Fransızca
ziyaretçiler için doğru dil her zaman daha iyidir.

---

## 10. Bir hata yaptıysanız: geri alma

Her kayıt bir "sürüm" olarak saklanır. Geri almak mümkündür:

1. Bize tek bir mesaj yazın, konu: "UCCIB geri alma".
2. Yazın: hangi sayfa, hangi tarih ve saat, ne yapmak istiyorsunuz.
3. Değişiklik 1 iş günü içinde geri alınır.

Kendiniz geri almak isterseniz (isteğe bağlı, teknik): `https://github.com/hisarweb-be/uccib/commits/main` adresinde
tüm değişiklikler saatleriyle listelenir.

---

## 11. Sık sorulan sorular

**S: Kaydettim ama sitede görmüyorum.**
C: 2 dakika bekleyin, sonra tarayıcıda Ctrl+F5 (Mac'te Cmd+Shift+R) ile sayfayı zorla yenileyin.

**S: Yanlışlıkla bir sayfayı kapattım.**
C: **Yayında** anahtarını tekrar açın, kaydedin. Sayfa geri gelir.

**S: Yeni bir sayfa ekleyebilir miyim?**
C: Yeni sayfa açmak bir tasarım kararıdır (menüdeki adı, üç dilde başlığı, üst görseli). Bunun için bize yazın. Mevcut
sayfaların içeriğini ise siz serbestçe değiştirebilirsiniz.

**S: Fotoğraf yüklenmiyor.**
C: Fotoğrafın boyutu 10 MB'dan büyükse küçültün. Yine olmazsa farklı bir tarayıcı deneyin.

**S: Şifremi unuttum.**
C: GitHub girişinde şifre sizde kalır, biz göremeyiz. GitHub şifrenizi unuttuysanız github.com üzerinden
sıfırlarsınız. Yedek yolu (Access Token) kullanıyorsanız token yenilenir; bize yazın, yenisini iletelim.

**S: Telefonla düzenleyebilir miyim?**
C: Evet. Tarayıcıdan aynı adrese girin. Telefonda menü altta açılır.

---

## 12. Ne yapılmaz

- **Mollie ödeme bağlantısını** kendiniz değiştirmeyin; ödeme çalışmaz hale gelebilir.
- **Sıra numarası** alanına çok büyük sayı yazmayın (999'dan küçük tutun).
- **Enlem / boylam** alanlarına tahminle sayı yazmayın: yanlış sayı haritada yanlış yeri gösterir. Emin değilseniz boş
  bırakın.
- **KBO numarası** ve **hukuki şekil** resmî belgedeki gibi olmalıdır. Emin değilseniz boş bırakın, uydurmayın.
- Ekranın üstündeki **Settings / Configuration** bölümüne girmeyin.
- Aynı sayfayı iki kişi aynı anda düzenlemeyin. Önce biriniz kaydetsin, sonra diğeri açsın.

---

## 13. Kim aranır

İçerikle ilgili sorular: UCCIB yönetimi (kendi aranızda).

Teknik bir sorun (giriş yapamıyorum, kaydetmiyor, site açılmıyor): bize doğrudan ulaşın, konu "UCCIB web sitesi".

Sorunu yazarken şunları ekleyin: hangi sayfa, saat kaçta, hangi tarayıcı, ekranda ne yazıyordu. Bu üç bilgi sorunu
çoğu zaman tek seferde çözer.
