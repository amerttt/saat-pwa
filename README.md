# Saat

iPhone için tam ekran, yatay gece masa saati. iOS StandBy şarjdayken bile bir süre sonra kapanıyor; bu uygulama ekranı açık tutar. Safari'de açıp Paylaş → "Ana Ekrana Ekle" ile kurulur, ilk açılıştan sonra internetsiz çalışır.

Canlı adres: https://amerttt.github.io/saat-pwa/

## Kullanım

- Sağa/sola kaydırarak 30 yüz arasında geçilir: Yuvarlak, Analog, Dünya, Parlayan, Modernist, Klasik, Minimal, Yıldız, Ay, Sözcük, Kontur, Dilim, Yörünge, Çetele, Odak, Gün Yayı, Nixie, Kum Saati, İkili, Daktilo, Lav, Jenerik, Borsa, Sürü, Not, Mesai, Pencere, Flip, Tablo, Bölgeler. Klavyede ok tuşları da çalışır.
- Ekrana uzun basınca (yaklaşık yarım saniye) ayarlar açılır: saat biçimi, gece modu, tarih, saniye ibresi, loşluk, gün dili, ekranı açık tutma, odak süresi, mesai başı ve sonu (Mesai yüzü için, varsayılan 09:00-18:00).
- Odak yüzünde ekrana dokunmak (kaydırmak değil) odak zamanlayıcısını başlatır ya da durdurur. Süre ayarlardan 5 ile 120 dakika arasında 5'er dakikalık adımlarla değişir, varsayılan 25. Biten oturum sayısı `saat.focus` anahtarında tutulur, gün değişince sıfırlanır.
- Gün Yayı yüzü İstanbul'un gün doğumu ve batımını NOAA denklemleriyle cihazda hesaplar, internet gerekmez.
- Bölgeler yüzü AWS bölgelerinin yerel saatini cihazın saat dilimi veritabanından hesaplar; hafta içi 09-18 arasındaki bölgeler turuncu yanar. Harita Dünya yüzüyle aynı yerel nokta listesini kullanır, internet gerekmez.
- Açık zeminli gündüz yüzleri (Sürü, Not, Mesai, Pencere, Flip, Tablo) gece modunda ters çevrilir ve sıcak griye düşer.
- Battery API olan tarayıcılarda sağ üst köşeye dokunmak pil göstergesini açıp kapatır.
- Son seçilen yüz ve ayarlar `localStorage` içinde `saat.v1` anahtarında saklanır.

## Pil ve ısı

- Dakikada bir, dakika sınırına hizalı tek `setTimeout` çalışır. `setInterval` ya da `requestAnimationFrame` döngüsü yoktur.
- Saniye ibresi saf CSS animasyonudur (`steps(60)`), her saniye JavaScript çalışmaz. Varsayılan olarak kapalıdır.
- Kadran çizgileri, yıldız noktaları ve harita yalnız dakika ya da ekran boyutu değişince yeniden hesaplanır.
- Ekran Screen Wake Lock API ile açık tutulur (iOS 16.4 ve sonrası, ana ekrana eklenmiş PWA). Daha eski iOS'ta sessiz, döngülü bir video yedek olarak kullanılır.
- OLED yanma koruması: bütün yüzler dakikada bir en fazla 1-2 piksel kayar ve ±3 piksellik bir alanda dolaşır. Böylece rakamların kenarları gece boyunca aynı piksellerde durmaz. Kayma animasyonsuzdur, ek iş yükü getirmez.

## Bağımlılık

Çalışma anında hiçbir kütüphane ya da dış istek yoktur. Düz HTML, CSS ve JavaScript.

- Fontlar (Fredoka, Outfit, Anton, Unbounded, Cormorant Garamond, Saira Stencil One, Special Elite, Courier Prime, Bodoni Moda, IBM Plex Mono, Permanent Marker) `fonts/` altında, yalnız latin ve latin-ext subset'leri. Lisans: SIL Open Font License; Special Elite ve Permanent Marker için Apache 2.0.
- Yuvarlak yüzü iPhone'da sistemin yuvarlak fontunu (`ui-rounded`, SF Pro Rounded) kullanır. Font cihazda zaten var, repo'ya gömülmez. Apple dışı cihazlarda Fredoka devreye girer.
- Dünya haritası `land-dots.json` dosyasındaki önceden hesaplanmış 1.706 noktadır. Kaynak: `world-atlas@2` countries-110m (Natural Earth, public domain), 82°K ile 58°G arasında 3°'lik ızgara.
- Wake Lock yedeği olan sessiz video NoSleep.js 0.12.0'dan alındı (MIT).
- `sw.js` bütün dosyaları kurulumda önbelleğe alır. Bir dosyayı değiştirince `sw.js` içindeki `VERSION` değerini artır.

## Yerelde çalıştırma

```bash
python3 -m http.server 8000
```

Service worker yalnız `https` ya da `localhost` üzerinde kaydolur.

## Bilinen sınır

iOS Safari pil bilgisi vermez (Battery API yok). Bu yüzden iPhone'da pil göstergesi ve sağ üst köşedeki dokunma alanı hiç yoktur. Battery API olan tarayıcılarda gerçek değer ve şarj durumu görünür.
