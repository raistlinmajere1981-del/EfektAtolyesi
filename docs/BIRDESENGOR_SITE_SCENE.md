# BirDeSenGör V2 site kaynak sahnesi

Admin’deki varsayılan `birdesengor:scene_v2`, yalnız şu yerel kurulumu okur:
`/home/raistlin/ChannelFoundry/channels/birdesengor/web`.
Kaynak `src/effects/birdesengor-effects.v2.json`; nesne kimliği, poz ve bağlantı
koordinatlarının sahibi `src/scene/data/study.scene.json` ile sitenin
`src/effects/effectsAdapter.js` adaptörüdür. Kanonik EfektAtölyesi doğrulayıcısı
ve derleyicisi de her açma/kaydetme/hazırlamada çalışır. Kaynak eksik veya
uyuşmazsa fikstüre dönüş yapılmaz. Özel `EFEKT_STUDIO_SCENE_TARGETS_FILE`
kayıtları ve resim hedefleri önceki yerel sözleşmelerini korur; site yazamazlar.

Önizleme, sitenin `public/scene-assets/approved/room-workshop-free-2to1.webp`
dosyasını ayrı `previewImage` veri alanında taşır; proje JSON’una resim eklemez.
1600 × 900 kaynak düzlemi çalışma alanına oranı korunarak sığdırılır; fotoğraf
site `.study-plate` davranışı gibi bu düzleme `object-fit: fill` ile doldurulur.
Nesne çerçeveleri ve kanonik efekt katmanları aynı düzlemdedir. Fotoğraf,
işaretler ve efektler ayrı kapatılabilir. Tek mevcut kanonik motor/ticker
kullanılır. Nesne pozları, bağlantı koordinatları ve görünürlük kontrolleri
kilitlidir; efekt kaydırması nesne genişliği/yüksekliğine göre düzenlenir.

Bu, kaynak koordinatları için oda fotoğrafı üzerinde bir efekt denemesidir.
Sitenin ayrı fiziksel kitap/kamera/vefk görsellerini, yaklaşma animasyonlarını
ve mobil/focus pozlarını yeniden oluşturmaz. Bu nesnelerin fotoğrafta eksik
olması onların silindiği anlamına gelmez; gerçek kaynak çerçeveleri seçilebilir.

`Kaydet` yalnız `.studio-drafts/birdesengor__scene_v2.scene.json` ve ona ait
`.source.sha256` sürüm kaydını yazar. Eski fikstür taslağı veya kaynakla
uyuşmayan taslak açılmaz; güncel site kaynağı açılır ve durum satırı bunu
bildirir. Eski taslak silinmez. Kullanıcının sonraki Kaydet eylemi yalnız bu
hedefin taslağını yeniler; diğer taslaklar etkilenmez.

`Site dosyasına hazırla`, kayıtlı ve temiz taslakta ayrı bir eylemdir. Mevcut
`admin:effects-prepare` IPC’sini kullanır; yayın/deploy yöneticisine bağlanmaz.
Hem kaydetme hem hazırlama, açılışta alınan kaynak sürümünü denetler. Bu sürüm,
JSON, manifest, adaptör, oda görseli ve `SceneRoot` üzerinden erişilen yerel
JS/JSX modüllerinin içerik özetidir. Paralel değişiklikte işlem reddedilir;
Yenile ile kaynak tekrar açılmalıdır. Hazırlama, geçici dosya yazdıktan sonra
son sürüm kontrolü ve atomik rename ile yalnız `src/effects/birdesengor-effects.v2.json`
dosyasını değiştirir; içerik aynıysa hiç yazmaz. Dosya izinleri korunur.
`public/content`, Studio verileri ve diğer site kaynakları yazılmaz.

Efekt sayısı, etkin efekt sayısı, site bağlantısı ve engeller Admin’de görünür.
Yuvalar `CANDLE_EFFECT_IDS` ve `PASSIVE_OBJECT_EFFECT_GROUPS` üzerinden
doğrulanır; elle eklenen kimlik, tür/nesne/bağlantı değişikliği ve eksik yuva
reddedilir. **Güncel V2 artık altı efekt yuvasını gerçek oda DOM’una bağlıyor:**
`candle` alev/parıltı/sönme dumanı ile
`incense-burner` ve `incense-holder` pasif duman/parıltısı.
Dört kitap/kamera/vefk odak hedefi değişmedi; ayrı mum temasına
dokunulunca alev iki saniye duman çıkararak sönüyor, tekrar temasla yanıyor.
Giriş/odak geçişleri sırasında kanonik ticker kapatılır; mobil manifestin
gizlediği `incense-holder` çizilmez ve azaltılmış hareket tercihi korunur.
Fotoğraf ve fiziksel nesnelerin ikinci bir kopyası üretilmez.

Hazırlık, bu bağlantıları yalnız efekt bileşenlerinin dosyada bulunmasına göre
değil, `SceneRoot` üzerindeki gerçek montaj, kanonik hook, fotoğraf düzlemindeki
konumlandırma ve CSS görünürlük sözleşmesine göre doğrular. Site kodu,
manifest, adaptör, görsel veya yerleşim CSS'i değiştiğinde kaynak sürüm özeti
farklılaşır; eski taslak doğrudan yazılamaz. Bilinmeyen yeni efekt kimlikleri,
nesne/ankraj kaymaları ve incelemeden geçen bağlantı sözleşmesine uymayan
değişiklikler reddedilir. Bugünkü altı kayıt siteye hazırlanmaya uygundur;
**hazırlamak canlıya yayınlamak değildir**.

Canlı site yayını/deploy ayrı bir iştir; bu eylem ağ isteği, yayın, commit veya
push yapmaz. Testler gerçek kaynağı salt okunur doğrular; yazma senaryoları
izole geçici site dizinlerinde çalışır.
