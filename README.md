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
- **LAB 118** — numune arşivi, güvenlik kapıları, beş analitik protokol, vaka modu, laboratuvar defteri ve rapor dışa aktarma içeren WebGL laboratuvar simülasyonu.
- **Türkçe / English** — tüm arayüz, veri etiketleri ve içerikler iki dilde.
- **Erişilebilirlik** — klavye kısayolları, ARIA etiketleri, odak yönetimi ve `prefers-reduced-motion` desteği.

## LAB 118 — analitik laboratuvar

LAB 118, periyodik tablodan bağımsız bir oyun değil; aynı element verisini kullanan bir analitik kimya tezgâhıdır. Amaç, bir numunenin kimliğini veya davranışını ölçüm, gözlem ve bağımsız kanıtlarla açıklamaktır.

### İş akışı

1. **Numune seç** — 118 elementin tamamı arşivden seçilebilir; rastgele numune de alınabilir.
2. **Protokol seç** — yoğunluk, yüzey/özellik, alev ve emisyon, reaksiyon hücresi veya termal/faz analizi.
3. **Güvenlik kontrolü** — gözlük, eldiven, önlük, çeker ocak, kurşun siper ve risk onayı protokole göre zorunludur.
4. **Deneyi çalıştır** — ölçümler, gözlemler, dengeli denklem ve güvenilirlik etiketi üretilir.
5. **Deftere kaydet** — her çalıştırma otomatik kaydedilir; kayıtlar tek tek silinebilir, Markdown olarak indirilebilir veya yazdırılabilir.

### Vaka modu

**VAKA 001 / numune A-01**, etiketsiz bir numunenin kimliğini bulma senaryosudur. Numune mineral yağ altında gelir; elementin adı, sembolü ve denklemlerdeki sembolü kimlik doğrulanana kadar maskelenir. En az iki bağımsız kanıt toplandıktan sonra aday listesinden kimlik doğrulanır. Doğru kimlikte maskeli kayıtlar açılır ve vaka deftere işlenir; yanlış adayda kanıtlara dayalı geri bildirim verilir. Vaka sırasında numune değiştirilemez.

### Bilimsel dürüstlük

- Her sonuç bir güvenilirlik etiketi taşır: **literatür**, **ölçüldü**, **öngörüldü**, **gösterge niteliğinde** veya **sembolik**.
- Yoğunluk ölçümleri 1σ belirsizlik ve literatür sapmasıyla raporlanır; gazlarda ideal gaz yaklaşımı ve 100 mL hacim kullanılır.
- Reaksiyon denklemleri dengelidir. Standart koşullarda (1 M, 25 °C, 1 atm) hesaplanan E° ve ΔG° değerleri yalnızca destekleyici kanıttır; gerçek hız ve ürün dağılımı koşullara bağlıdır.
- Eşik sıcaklığın altında denklem uygulanmaz; reaksiyon gözlenmiyorsa denklem bloğu gösterilmez.
- Veriler eğitim simülasyonu içindir; gerçek laboratuvar prosedürleri için güncel SDS ve kurumsal güvenlik protokollerini kullanın.

### Laboratuvar verileri

Profil, güvenlik seçimleri, defter ve vaka durumu tarayıcıda saklanır:

- `pt.lab.profile`
- `pt.lab.safety`
- `pt.lab.notebook`
- `pt.lab.mission`

Defter ve raporlar istemci tarafında üretilir; hiçbir veri sunucuya gönderilmez. Tarayıcı verilerini temizlemek bu kayıtları da siler.

### WebGL yedeği

3B tezgâh WebGL gerektirir. WebGL yoksa veya bağlam kaybolursa panel tabanlı deney motoru çalışmaya devam eder; ölçümler, güvenlik kapıları, defter ve rapor işlevleri kullanılabilir. Bağlam geri geldiğinde 3B sahne otomatik olarak yeniden başlar.

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
| `Ctrl/Cmd + Enter` | Laboratuvarda deneyi çalıştır |

## Proje yapısı

```
index.html                 Uygulama iskeleti ve SVG ikon sprite'ı
css/style.css              Tüm responsive stiller
js/i18n.js                 TR/EN arayüz metinleri ve yardımcılar
js/reactions.js            Tepkimeler, bileşikler, kullanımlar, GHS/H ifadeleri
js/atom3d.js               Three.js atom/orbital sahneleri ve orbital matematiği
js/app.01.js … app.06.js   Uygulama denetleyicisi (modüler parçalar)
js/app.js                  Parçalardan üretilen nihai çalışma dosyası
css/lab.css                LAB 118 HUD, tezgâh ve responsive stiller
js/lab.data.js             Alev/tayf, reaktif, reaksiyon ve vaka verileri
js/lab.01.js … lab.06.js   LAB 118 çalışma zamanı (modüler parçalar)
js/lab.js                  Parçalardan üretilen nihai laboratuvar dosyası
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

LAB 118 çalışma zamanı da benzer şekilde üretilir:

```bash
cat js/lab.01.js js/lab.02.js js/lab.03.js js/lab.04.js js/lab.05.js js/lab.06.js > js/lab.js
```

Yalnızca `js/lab.js` ve `js/lab.data.js` çalışma zamanında yüklenir; `lab.0*.js` parçaları dağıtıma dahil edilmez.

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
- `.vercelignore` geliştirme/test dosyalarını, ham verileri ve modüler JS parçalarını dışarıda bırakır; çalışma zamanında yüklenen `js/app.js`, `js/lab.js` ve diğer varlıklara dokunmaz.
- Element fotoğrafları Wikimedia Commons'tan yüklenir; bu görseller için internet bağlantısı gerekir, ancak bağlantı yoksa yer tutucu gösterilir.
- WebGL, HTTPS üzerinden sorunsuz çalışır; WebGL desteklemeyen tarayıcılarda atom sekmesi otomatik olarak Bohr modeli/elektron dizilimi görünümüne döner.

## Notlar

- 3B görünüm için WebGL gerekir. WebGL yoksa atom sekmesi Bohr modeli/elektron dizilimi bilgisini ve kontrolleri göstermeye devam eder; uygulama çökmez.
- Element fotoğrafları uzak sunucudan geldiği için bağlantı yoksa yer tutucu görsel gösterilir.
- Uygulama tamamen istemci tarafındadır; hiçbir veri sunucuya gönderilmez.
