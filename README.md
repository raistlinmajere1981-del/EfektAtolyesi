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

BlackSea fotoğrafı ve proje örneği: `http://127.0.0.1:8095/?example=blacksea`. Fotoğraf 1536×1024; kullanım hakkı BlackSea sitesine bağlıdır. Gündoğdu için varsayılan 1818×1228 Gideros örneğini kullanın. Düzenle → JSON dışa aktar → hedef sitede `bash scripts/install-effect-scene.sh ~/Downloads/file.json --check-only` → aynı komutu `--check-only` olmadan çalıştır → yerelde doğrula → onay sonrası site-only deploy. Ayrıntı: hedef sitenin `docs/EFFECT_ENGINE.md` dosyası. Aktif JSON kurulana kadar iki site statik fotoğraf gösterir.


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
- Gündoğdu'nun **aktif site kökü** için hero bağlantısı,
  `assets/img/gideros-1-1818.webp` ile
  `assets/effects/hero.scene.json` üzerinden çalışır. SSH/rsync hedefi
  sitenin mevcut `scripts/deploy-site.sh` yolu ile eşleşir. Canlı aktarım
  başlatılmadan önce kullanıcı onayı ve diğer Admin işlem kilitleri gerekir.
  Gündoğdu `canonical/` şablon kaynakları ayrı olup otomatik site-only
  deploy varmış gibi gösterilmez.
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
manifest'e taşındı. Gündoğdu'nun bağımsız aktif PHP sitesi ise
kendi `hero-effects.mjs` köprüsüne hâlâ ihtiyaç duyar;
henüz canonical site şablonuna taşınmış değildir.

Hazırlanmış sahne daha sonra düzenlenebilir: Yerel sahneyi güncelle,
manifest girişlerini çoğaltmadan yalnız yerel sahne dosyasını yeniler.
Fotoğraf hash değişiminde eski sahne kullanılamaz; canlı deploy yoktur.
