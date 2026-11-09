# Efekt Atölyesi 1.1

Bağımsız, yerel fotoğraf ve çokgen efekt düzenleyicisi. Çalışma zamanı paket veya derleme gerektirmez: ES modülleri, Canvas 2D ve SVG kullanır. İki siteye bağımsız motor kopyası ve JSON dışa aktarımıyla bağlanır.

Gerekenler: Python 3, kontroller için Node.js 18 veya üzeri; güncel bir masaüstü tarayıcı.

```bash
cd ~/YardimciWorkspace/EfektAtolyesi
bash scripts/dev.sh
```

Tarayıcıda http://127.0.0.1:8095 adresini açın. Sunucuyu Ctrl+C ile kapatın. İnternetten bağımsız çalışır; dosyaları bir sunucuya yüklemez.

```bash
bash scripts/check.sh
```

Bu komut tüm kaynak/test modüllerinin sözdizimini ve Node testlerini kontrol eder.

Bölge listesinden veya fotoğraftaki çokgenden seçim yapın. Köşeleri sürükleyin, özelliklerden X/Y girin veya odaklanmış köşede ok tuşlarını kullanın (Shift: 10 piksel). Köşe seçicisinden kenar seçip ortasına köşe ekleyebilir, en az üç köşe kalacak şekilde silebilirsiniz. Koordinatlar özgün fotoğraf pikselleridir; sığdır/doldur ve pencere boyutu bunları değiştirmez. Kendi üzerinden geçen veya sıfır alanlı çokgenler reddedilir.

Seçili bölgeye yüzey dalgacıkları, güneş yansıması veya ince güneş parıltıları ekleyin. Efekt özelliklerinden türü, bölgesi, tohumu ve parametreleri değiştirin; kopyalayın, kapatın veya silin. Bölge silindiğinde bağlı efektleri de silinir. Duraklat, önce/sonra, bölge kılavuzları ve aynı tohumla yeniden başlat kontrolleri önizlemeye uygulanır. Azaltılmış hareket tercihi statik fotoğrafı korur.

1.1 ile seçili efekt için **↑ Yukarı / ↓ Aşağı** gerçek çizim sırasını değiştirir; seçim korunur ve işlem geri alınabilir. **Sakin / Doğal / Canlı** hazır ayarları yalnız seçili türün sayısal parametrelerini değiştirir; tohum, bölge, etkinlik ve dalga/köpük anahtarları korunur. **Yalnız bu efekt / Tüm efektleri göster** yalnız önizleme filtresidir, JSON'a yazılmaz; seçili efekt kapalıysa veya bölgesi gizliyse gösterilmez. Önce/sonra her durumda statik fotoğrafla karşılaştırır. Proje açıldığında yalnız gösterim sıfırlanır.

İnce güneş parıltıları BlackSea sunlight motorunun yerel kopyasından uyarlanmıştır. Işık şeridi üreten güneş yansımasından farklı, bağımsız ince çizgilerdir. Dağılım merkezi ve yarıçapı seçili çokgen sınırlarından özgün fotoğraf koordinatlarında türetilir; çizim çokgene kırpılır. Birden çok örnek, tohum ve v1 JSON ile çalışır. Çok küçük veya çok dar bölgelerde görünür çizgi alanı doğal olarak sınırlıdır. Mevcut iki efekt ve eski v1 projelerin alanları değişmedi.

**Kıyı köpüğü henüz yoktur.** BlackSea kıyı motorunun `startLine` ve `shoreLine` girdileri ayrı, düzenlenebilir açık yol türleri ve birbirleriyle eşleme gerektirir. Mevcut kapalı çokgen bölge modeli bu iki hattı ifade etmez; çokgeni kıyı hattı gibi yorumlamak doğru olmaz. Yüzey dalgacıklarındaki mevcut küçük kırılma köpükleri bu kıyı efektinden ayrıdır. Site hero entegrasyonları yalnız kayıtlı efektleri kullanır.

Fotoğraf açma PNG/JPEG/WebP/AVIF/GIF raster dosyalarını kabul eder; bölgeler yeni fotoğraf boyutuna ölçeklenir. Proje açma v1 JSON doğrulaması yapar ve fotoğrafı yükleyemeyen projeyi kabul etmez. Geri al/yinele düğmeleri veya form alanı dışında Ctrl/⌘ Z ve Ctrl/⌘ Shift Z kullanılır. Geçmiş son 30 düzenleme grubunu tutar.

Kalıcı kayıt için **JSON dışa aktar** kullanın; otomatik kayıt yoktur. Kullanıcı fotoğrafları JSON içine gömülür. Yerel örnek JSON'u `assets/gideros-1-1818.webp` dosyasına başvurur; taşırken bu dosyayı aynı yolda tutun. Proje/dışa aktarım sınırı 25 MB, fotoğraf sınırı 80 megapikseldir. Bilinmeyen biçim/sürüm/efektler ve geçersiz parametreler hata mesajıyla reddedilir.

Örnek fotoğraf: [Makalp, Gideros Bay1, 30 Haziran 2007](https://commons.wikimedia.org/wiki/File:Gideros_Bay1.jpg), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Yerel örnek için WebP olarak yeniden kodlandı. Fotoğrafın lisansı ve atfı korunmalıdır; kullanıcının açtığı fotoğrafların hakları kendisine aittir.

Tarayıcı kontrolü `.test-artifacts/browser-smoke-1.1.cjs` içindedir. Mevcut yerel Playwright ve `/usr/bin/brave` kullanılır; paket veya tarayıcı indirmez. Sunucu açıkken:

```bash
node .test-artifacts/browser-smoke-1.1.cjs
```

Kontrol mevcut düzenleme akışını, yeni kontrolleri, JSON aktarımını, dört farklı çokgende gerçek Canvas parıltı piksellerini, statik karşılaştırmayı ve 390 px görünümü doğrular. Ekran görüntüleri `.test-artifacts/editor-1.1.png` ve `.test-artifacts/editor-1.1-mobile.png` olarak kaydedilir.

BlackSea örnek görseli ve proje kaynağı: http://127.0.0.1:8095/?example=blacksea.
Gündoğdu 1818×1228 Gideros sahnesini Admin Efekt Atölyesi'nde kaydedip
Siteye yayınla ile günceller. Eski install-effect-scene.sh Gündoğdu'nun
kanonik ana sayfasını güncellemez; site docs/EFFECT_ENGINE.md geçerlidir.


## Admin Panel içinde çalışma (2026-10)

Yardımcı Asistan Admin > **Efekt Atölyesi**, bu deponun editörünü kendi içinde görüntüler.
Çekirdek motor ve efekt kayıtları yalnız bu depodadır; Admin, kaynak editörü paketine kopyalayıp
proje/görsel seçimi, taslak kaydı ve hedefli yayın işlemleri için köprü sağlar.

- Proje ve görsel kayıtları: `config/projects.json`. `projects[]` ve her projenin
  `images[]` listesi sayısal olarak sınırlı değildir. Her görselin fotoğraf, sahne,
  boyut, kaynak dizin ve yayın hedefi açıkça tanımlıdır.
- Yerel taslaklar: `.studio-drafts/<proje>__<görsel>.scene.json` (Git dışı).
  Düzenleme sonrası otomatik kaydolur; canlı site dosyasını değiştirmez.
- Siteye yükle: Taslağın şeması/motoru doğrulanır, yalnız sahne JSON'u kaynak
  site deposuna yazılır ve ilgili hedefe gönderilir. Fotoğraf, web modülü ve
  tüm-site paketleri bu işlemde yüklenmez. BlackSea Natro FTP kimlik bilgileri
  mevcut Yardımcı Asistan yerel credentials kaydından okunur. HTTPS sahne
  içeriği ayrıca karşılaştırılarak doğrulanır.
- **Gündoğdu (2026-11-05):** Aktif ana sayfa hedefi
  `assets/site/img/gideros-1-1818.webp` fotoğrafına bağlıdır.
  `hero.scene.json` ve `effects-manifest.json` hem
  `canonical/public/assets/site/scenes` hem `assets/site/scenes` altında
  eşit içerikle tutulur. SSH yalnız bu dört site dosyasını aktarır;
  web modülü veya tam site deploy edilmez. HTTPS scene + manifest
  doğrulanmadan başarı dönmez. Eski `assets/effects/hero.scene.json`
  yolu aktif site tarafından okunmaz.
- Yeni efekt türü için `src/registry/effects.mjs` kayıt ve ayrı runtime
  modülü gerekir. Site runtime kopyası yeni efekti tanımadan o efektli sahne
  yayınlanmamalıdır. Atölye çekirdeği hiçbir siteye bağımlı değildir.
- Admin build/dev öncesi `scripts/sync-effect-studio.mjs` ile kaynak editör
  `apps/admin-control-center/public/effect-studio` altına kopyalanır;
  bu klasör Git dışıdır. Yeni kaynak değişikliklerinde admin yeniden derlenir.

İlgili kontroller: `bash scripts/check.sh` (izole çoklu proje/taslak/yayın testi dahil),
Admin için `npm run typecheck` ve `npm run build`. Browser/Electron smoke
deneysel olarak `.test-artifacts/admin-effects-smoke.cjs` içindedir.

Yayın işlemi kullanıcı onayı olmadan başlatılmaz. Ayrı admin Deploy/Release
işlemi sürerken eşzamanlı canlı efekt yayını engellenir.


### Admin'de site keşfi ve tek ekran (2026-11-02)

Yeni Admin görünümünde site listesi `YardimciAsistan/config/installations.json`
kaynağından üretilir. Yalnız site/landing kurulumları keşfedilir; efekt
hedefleri ise sayfa tasarımında sabit `<img src>` ile başvurulan fotoğraflar
ve önceden açıkça kayıtlı sabit görsellerdir. Dinamik ürün/galeri/oda/masa
medyası ve tanıtım vitrininin uygulama ekran görüntüleri kapsam dışıdır.
`config/projects.json` yalnız mevcut BlackSea/Gündoğdu görsel ve yayın
eşleşmeleri için overlay olarak kalır. Testlerde `EFEKT_STUDIO_PROJECTS_FILE`
ile tam izole özel fixture kullanılabilir.

Admin'in dış kaydırması yoktur: site görsel gezgini, sahne listesi ve sağ
ayarlar bağımsız kaydırılır; editör önizlemesi sabit çalışma alanını doldurur.
Kaydedilen sahne için kaynak fotoğraf hash'i ayrı sidecar'da izlenir; fotoğraf
sonradan değişirse eski taslak kendiliğinden yüklenip yayınlanmaz.
Bağlanmamış sabit görseller yerelde düzenlenebilir; canlı yayın düğmeleri doğru
şekilde kapalı kalır. Teknikel'in API-kaynaklı ürün fotoğrafları özellikle
keşfedilmez; ileride sabit dekoratif tasarım fotoğrafı eklenirse bu görsel
Atölye'de listelenebilir. Veri kaybı ve test sahnesi
temizliği bu hazırlığın zorunlu adımı değildir.


#### Sabit görseli ilk kez bağlama

Ortak site şablonu 0.5.2, `public/assets/site/scenes/effects-manifest.json`
içinde sabit site fotoğrafı için kaynak `src` yolu, tekil slot ve sahne
dosyasını eşler. Tasarımdaki `<img>` niteliğini yeniden düzenlemek gerekmez;
dinamik ürün/oda/masa/galeri görselleri desteklenmez. Atölye'de bağlantısız
ama **aktif sitede kullanılan** sabit fotoğraf seçilerek bir görünür efekt
taslağı kaydedildiğinde **Siteye bağlamayı hazırla** etkinleşir.
Bu yalnız yerel sitenin `public/assets/site/scenes/` klasörüne sahne ve
manifest yazar. Demo test alanında düz `deneme/assets/site/scenes/`
yoluna yazar. Başarılı hazırlık `Site deploy'u bekliyor` olarak görünür.
Sahne ve manifestin live siteye geçmesi için ayrı site deploy/HTTPS kabul
gerekir. `canonical/` klasörü aktif deploy tarafından kullanılmıyorsa
otomatik hazırlama kapalı kalır. BlackSea ve Gündoğdu'nun önceden bağlı
hero sahneleri ise aynı hedefli yayın yollarını korur.

Hazırlık sonrası Admin'deki **Deploy ekranını aç** bağlantısı yalnız açıkça
eşlenmiş hedefleri kullanır (bugün yalnız `landing → landing`). Site kimliğinden
veya adından hedef tahmin edilmez. Bağlantı yalnız Deploy ekranına geçer ve
hedefi seçer; ön kontrol, onay veya canlı yayın başlatmaz. Kaynak fotoğraf
hash'i değiştiğinde veya hedef yolu geçersiz olduğunda `canPrepare` kapanır.
Teknikel'in hero görseli API ürün/galeri medyası olduğundan sabit görsel
listesi boş kalır; ürün/galeriye efekt bağlama işlemi önerilmez. Teknikel'in
`teknikel-web` Admin hedefi de site aktarımı değil, yalnız web modülü
güncellemesidir ve Deploy ekranında bu kapsam ayrıca açıklanır.
İlgili izole kontroller: `admin-studio.test.mjs`, `site-projects.test.mjs`,
`site-preparation.test.mjs`, `site-flat-preparation.test.mjs`.


Sabit görseller için ortak şablonda artık tek etkinleştirme kuralı
`effects-manifest.json` kaydıdır. Eski `config.effects` ve
`data-effect-slot` uyumluluğu kaldırıldı. BlackSea hero sahnesi
manifest'e taşındı. Gündoğdu da kanonik `core/effects.mjs`
ve `effects-manifest.json` yolunu kullanır; eski `hero-effects.mjs`
ve `assets/effects` yolu aktif yayının parçası değildir.

Hazırlanmış sahne daha sonra düzenlenebilir: Yerel sahneyi güncelle,
manifest girişlerini çoğaltmadan yalnız yerel sahne dosyasını yeniler.
Fotoğraf hash değişiminde eski sahne kullanılamaz; canlı deploy yoktur.

### BirDeSenGör V2 — Tur 2: tıklama efektleri

Nesne registry'sindeki `metal-glint` ve `water-ripple` yalnız **v2 objectScene**
çizicileridir; fotoğraf v1 registry/modeli değişmez. Canvas 2D çizimi kanonik
`src/runtime/effects/` içinde, seeded ve geçen saniyeye bağlıdır. Metal yansıması
bıçak maskesindeki dar gradient yoludur; su efekti elipse kırpılan iki ince halkadır.
Varsayılan süre 1,2 saniye; süre/hız aralığı toplam 0,917–1,5 saniyedir. Efekt
sonunda kanonik ortak ticker aboneliği kapanır. Reduced-motion, görünmez sekme,
intersection ve düşük güç bütçeleri mevcut runtime kapılarını kullanır.

Sitenin üç ayrı yuvası: `guardian-sword-left-glint`,
`guardian-sword-right-glint`, `water-basin-ripple`. Aynı adlı nesnelere ve mevcut
`metal-glint`/`water-surface` ankrajlarına bağlanır. Fotoğraftaki gerçek yol,
nesneye göre offset, genişlik/yükseklik, bıçak yönü/eni/ışık bandı ve su yayılımı
parametreleridir. Eski focus yerleşimi sağ kılıç fotoğraf konumuyla aynı değildir;
yayınlanan offset bu farkı telafi eder. Kaynak nesneleri/ankrajları taşınmaz.

Sitedeki `usePulseObjectEffects`, canonical compiler + `bindObjectScene` ile
her kabul edilen tıklamada yeni host açar; 180 ms nesne bazlı cooldown uygular.
Yeni kabul edilen click önceki hostu yok eder. Süre bitimi, Escape, oda fazından
çıkış, visibility/pagehide/blur, reduced-motion değişimi ve unmount temizliği
host/canvas/timer'ları kapatır. Canvas pointer-events:none kalır. Site kendi
çizicisini yazmaz; kullanılmayan BasinEffects prototipi bağlanmaz. Reduced-motion
tercihinde canvas açılmadan erişilebilir dokunuş bildirimi verilir.

Admin kaynak hazırlığı yalnız dokuz sabit yuvayı kabul eder; yanlış ID/tür/ankraj,
eksik yuva, kaynak revizyon farkı ve kopmuş pulse mount hazırlığı reddeder.
V2 editöründeki mevcut Hafif/Doğal/Belirgin profiller ve slider'lar korunur;
tıklama efektlerinde **Efekti dene** bir kez çalıştırır, otomatik preview bunları
başlatmaz. Hançer, kaftan ve sandığa canlı efekt eklenmez.

Doğrulama:

```bash
bash scripts/check.sh
# Site kökünde; yerel Chromium ve loopback sunucusu gerektirir:
node tests/pulse-effects-e2e.mjs
node tests/ambient-effects-e2e.mjs
# Admin kökünde; güncel kanonik kaynak paketini doğrudan dener:
node tests/effect-studio-pulse-preview.test.mjs
npm run typecheck
npm run build
```

Site testi 1920×1080, 1366×768, 390×844 ve reduced-motion; pointer/Enter/Space,
fokus görünürlüğü, bağımsız kılıçlar, tek tas, cooldown/restart/storm, cancel ve
aktif canvas piksellerini denetler. Screenshot hedefi sitede
`artifacts/effect-round2/`, Admin kaynak preview için
`/tmp/birdesengor-effect-round2-preview/` olur. Bu dosyaların oluşması tek başına
kabul değildir; test logu ve görsel değerlendirme birlikte okunmalıdır.

Admin'in normal build/sync komutu ortak web-site-template motor hash'ini de
kontrol eder. Kanonik motor değiştiğinde bu kopya ayrı, yetkili bir senkronizasyon
ister; Admin paketinin eski motoruyla yeni türleri desteklediği varsayılmaz.
Bu kapı geçmeden paketlenmiş Admin sürümü hazır sayılmaz.
