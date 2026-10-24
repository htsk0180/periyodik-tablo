# Periyodik Tablo — İnteraktif Element Simülasyonu

118 elementin tamamını keşfetmek için hazırlanmış, WebGL destekli ve tamamen mobil uyumlu bir periyodik tablo uygulaması. Derleme adımı yoktur; tarayıcıda doğrudan çalışır.

## Özellikler

- **118 element, eksiksiz veri** — atom numarası, kütle, kategori, grup/periyot, elektron dizilimi, oksidasyon basamakları, izotoplar, fiziksel/kimyasal özellikler, keşif bilgisi, bolluk oranları ve Türkçe/İngilizce özetler.
- **3B atom ve orbital görünümü** — Three.js ile Bohr modeli ve gerçek dalga fonksiyonu tabanlı olasılık bulutu (s, p, d, f orbitalleri; manyetik orbital seçimi; otomatik döndürme ve yakınlaştırma).
- **Tepkimeler ve bileşikler** — element kategorisine göre tepkime profili, örnek denklemler, yaygın bileşikler ve kullanım alanları.
- **Emisyon tayfları** — 96 element için gömülü tayf görselleri.
- **Güvenlik bilgileri** — GHS piktogramları, H/P ifadeleri, NFPA 704 ve ADR sınıfları.
- **Arama ve filtreleme** — sembol, ad veya atom numarasıyla arama; kategori/faz filtreleri; liste görünümü.
- **Renklendirme modları** — kategori, fiziksel hâl, elektronegatiflik, erime noktası, atom yarıçapı ve keşif yılı.
- **Quiz** — kolay/orta/zor seviyelerde 10 soruluk turlar; açıklamalı geri bildirim ve `localStorage` ile en iyi skor.
- **Karşılaştırma** — iki elementin özelliklerini yan yana görme ve periyodik eğilim yorumları.
- **Türkçe / English** — tüm arayüz, veri etiketleri ve içerikler iki dilde.
- **Erişilebilirlik** — klavye kısayolları, ARIA etiketleri, odak yönetimi ve `prefers-reduced-motion` desteği.

## Çalıştırma

Herhangi bir sunucu yeterlidir; örneğin:

```bash
cd periyodik_tablo
python3 -m http.server 8000
```

Ardından <http://localhost:8000/> adresini açın.

> `file://` üzerinden açmak yerine yerel sunucu kullanın. Uygulama normalde `assets/data/elements.js` dosyasını doğrudan yükler; yine de tarayıcı güvenlik kısıtları ve olası JSON yedeği için HTTP önerilir.

## Klavye kısayolları

| Tuş | İşlev |
| --- | --- |
| `/` veya `Ctrl/Cmd + K` | Aramayı aç |
| `Esc` | Arama sonuçlarını, elementi veya eğilimler penceresini kapat |
| `←` / `→` | Element penceresi açıkken önceki/sonraki element |
| `1` – `4` | Quiz sırasında seçenek işaretle |

## Proje yapısı

```
index.html                 Uygulama iskeleti ve SVG ikon sprite'ı
css/style.css              Tüm responsive stiller
js/i18n.js                 TR/EN arayüz metinleri ve yardımcılar
js/reactions.js            Tepkimeler, bileşikler, kullanımlar, GHS/H ifadeleri
js/atom3d.js               Three.js atom/orbital sahneleri ve orbital matematiği
js/app.01.js … app.06.js   Uygulama denetleyicisi (modüler parçalar)
js/app.js                  Parçalardan üretilen nihai çalışma dosyası
assets/data/elements.js    Gömülü element verisi (window.PERIODIC_DATA)
assets/data/elements.json  Aynı verinin JSON yedeği
assets/vendor/             three.min.js ve OrbitControls.js
assets/fonts/              Yerel Inter ve Space Grotesk WOFF2 dosyaları
scripts/build_data.py      Veri birleştirme/üretme betiği
```

### `js/app.js` hakkında

`js/app.js`, `app.01.js`–`app.06.js` parçalarının birleşimidir. Parçalarda değişiklik yaptıktan sonra yeniden üretin:

```bash
cat js/app.01.js js/app.02.js js/app.03.js js/app.04.js js/app.05.js js/app.06.js > js/app.js
```

Doğrudan `js/app.js` üzerinde çalışacaksanız bu adımı atlayabilirsiniz; ancak parçalarla olan tutarlılığı korumak için üretimi tekrarlamak en iyisidir.

## Veri kaynakları ve lisanslar

Veri seti aşağıdaki açık kaynaklardan birleştirilmiştir:

- [Bowserinator/Periodic-Table-JSON](https://github.com/Bowserinator/Periodic-Table-JSON) — MIT / CC BY-SA
- [pse-info.de](https://www.pse-info.de/) / [komed3/periodic-table](https://github.com/komed3/periodic-table) — MIT
- [lmmentel/mendeleev-data](https://github.com/lmmentel/mendeleev-data) — MIT
- [Türkçe Wikipedia](https://tr.wikipedia.org/) — CC BY-SA 4.0 (Türkçe özetler)

Element fotoğrafları Wikimedia Commons'tan yüklenir ve kendi lisanslarına tabidir. Emisyon tayfı görselleri pse-info.de kaynaklıdır. Three.js ve OrbitControls MIT lisanslıdır. Inter ve Space Grotesk yazı tipleri SIL Open Font License 1.1 kapsamındadır.

Bu proje eğitim ve demo amaçlıdır. Kimyasal veya güvenlik kararları için güncel SDS/güvenlik bilgi formlarını kullanın.

## Veriyi yenileme

`scripts/build_data.py`, `assets/data/` altındaki ham dosyaları birleştirir ve Türkçe Wikipedia özetlerini önbelleğe alır. Yeniden üretmek için:

```bash
python3 scripts/build_data.py
```

Betik `assets/data/elements.json` ve `assets/data/elements.js` dosyalarını günceller. Türkçe özet önbelleği `assets/data/wikipedia_tr.json` dosyasındadır; ağ erişimi yoksa mevcut önbellek kullanılır.

## Vercel'e dağıtım

Proje tamamen statiktir; sunucu tarafı kod, veritabanı veya build adımı yoktur. Vercel'in ücretsiz Hobby planı yeterlidir ve dağıtım sonunda otomatik olarak bir `*.vercel.app` adresi alırsınız.

### Yöntem 1 — Vercel CLI

Node.js kurulu bir makinede proje klasöründe:

```bash
npm i -g vercel
vercel login
vercel --prod
```

İlk çalıştırmada gelen sorularda:

- **Set up and deploy?** → `Y`
- **Which scope?** → kendi hesabınız
- **Link to existing project?** → `N`
- **Project name** → `periyodik-tablo`
- **In which directory is your code located?** → `./`
- **Want to modify these settings?** → `N`

Framework algılanmazsa statik site olarak yayınlanır. Build command ve output directory boş kalmalıdır.

### Yöntem 2 — GitHub üzerinden

1. Projeyi bir GitHub deposuna yükleyin.
2. [vercel.com/new](https://vercel.com/new) adresinden depoyu içe aktarın.
3. **Framework Preset:** `Other`
4. **Build Command:** boş
5. **Output Directory:** boş (kök dizin)
6. **Deploy** düğmesine basın.

### Notlar

- `index.html` kök dizinde olduğu için ek yapılandırma gerekmez.
- Tüm fontlar, Three.js ve element verileri yereldir; CDN bağımlılığı yoktur.
- `.vercelignore` yalnızca geliştirme/test ham verilerini dışarıda bırakır; çalışma zamanı dosyalarına dokunmaz.
- Element fotoğrafları Wikimedia Commons'tan yüklenir; bu görseller için internet bağlantısı gerekir, ancak bağlantı yoksa yer tutucu gösterilir.
- WebGL, HTTPS üzerinden sorunsuz çalışır; WebGL desteklemeyen tarayıcılarda atom sekmesi otomatik olarak Bohr modeli/elektron dizilimi görünümüne döner.

## Notlar

- 3B görünüm için WebGL gerekir. WebGL yoksa atom sekmesi Bohr modeli/elektron dizilimi bilgisini ve kontrolleri göstermeye devam eder; uygulama çökmez.
- Element fotoğrafları uzak sunucudan geldiği için bağlantı yoksa yer tutucu görsel gösterilir.
- Uygulama tamamen istemci tarafındadır; hiçbir veri sunucuya gönderilmez.
