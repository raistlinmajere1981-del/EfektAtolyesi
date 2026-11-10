# Efekt Atölyesi — Etkileşim Tetikleyicileri / Aşama 1

Tarih: 2026-11-10. Yerel geliştirme; commit, push ve deploy yok.

## Kapsam

Efekt Atölyesi ve Admin editöründeki tetikleme modelleri:
- Sürekli (ambient): eski varsayılan alev, ışık ve duman davranışı değişmedi.
- OnClick (click): mevcut sonlu efektler eskisi gibi çalışır; glow seçildiğinde 0→1→0 oynatır.
- OnHover (hover): geri dönebilen glow için, imleç çıkınca mevcut ilerlemeden sıfıra iner. Klavye odağı da hover tetikler.

Diğer efekt türleri zorla geri sarılmaz: flame/smoke yalnız ambient; metal-glint/water-ripple/pendulum-sway click. İzinli tetikleyiciler registry tarafından belirlenir.

V2 JSON effect.trigger alanı opsiyoneldir, eski projeler aynı varsayılan tetikleyiciyle açılır. Etkileşimli glow için isteğe bağlı interaction.enterMs ve interaction.leaveMs değerleri vardır (80–2000 ms). Model doğrular, derleyici runtime'a geçirir. Paylaşılan kanonik ticker kullanılır, ikinci render motoru yoktur.

Pointer/focus çıkınca geri dönüş bulunduğu kareden başlar. Bittiğinde ticker durur. Reduced-motion, gizlenen sayfa, devre dışı bırakma ve unmount temizliği hareketi sıfırlar.

## Admin ve önizleme

Seçili efektte tetikleme menüsü açılır; yalnız uyumlu değerler sunulur. Glow OnHover/OnClick için ileri–geri süreleri panelden düzenlenebilir. Önizleme gerçek kanonik motorla çalışır. Site kaynaklı sabit nesne/efekt yuvası kuralı korunur: Admin yeni site yuvası oluşturmaz.

Canonical EfektAtolyesi motoru, YardimciAsistan vendor kopyası ve gömülü Admin editörü mevcut senkronizasyon komutlarıyla eşitlenir.

## Aşama 2'ye devredilenler (bu turda yapılmadı)

1. BirDeSenGör web sceneRegistry ve effectsAdapter içine yeni hover efekt yuvaları, kimlikler ve doğru ankrajlar.
2. Evren/Topluluk kapakları, kamera ekranı ve Çizim Atölyesi için sahneyle örtüşen ışık katmanları. Divit ayrı oda nesnesi olarak geri dönmeyecek.
3. SceneRoot oda evresinde pointerenter/pointerleave ve focusin/focusout bağlayacak; click nesnenin açılma eylemini engellemeyecek.
4. Admin kaynak kayıtlarının web hover runtime'ına iletilmesi.
5. Masaüstü, mobil, reduced-motion, kitap/kamera açılış-kapanışı ve etkileşim yoğunluğu testleri.

Önemli: Admin tetikleme seçeneği ve önizlemesi bu aşamada çalışır; web sahnesine yeni OnHover bağlanmadı. Site kaynaklı efekti canlı hover olarak yayınlamadan önce Aşama 2 tamamlanmalıdır.

## Güvenlik

Codex'in raporladığı terminal çıktısı API anahtarı sızıntısı bu çalışmada okunmadı veya kaydedilmedi. İlgili sağlayıcıdaki anahtar iptal edilip yenilenmelidir.
