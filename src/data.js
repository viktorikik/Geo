// src/data.js — только данные
import { LEVELS, MASTERY_LEVELS } from './config.js';

// Ключ — ISO 3166-1 numeric (3 цифры, строка)
// Формат: { name, capital, flag (2-букв.), level }
export const COUNTRIES_DB = {
  // ---------- ЕВРОПА ----------
  '004': { name: 'Албания', capital: 'Тирана', flag: 'AL', level: 'europe' },
  '008': { name: 'Андорра', capital: 'Андорра-ла-Велья', flag: 'AD', level: 'europe' },
  '040': { name: 'Австрия', capital: 'Вена', flag: 'AT', level: 'europe' },
  '056': { name: 'Бельгия', capital: 'Брюссель', flag: 'BE', level: 'europe' },
  '070': { name: 'Босния и Герцеговина', capital: 'Сараево', flag: 'BA', level: 'europe' },
  '100': { name: 'Болгария', capital: 'София', flag: 'BG', level: 'europe' },
  '191': { name: 'Хорватия', capital: 'Загреб', flag: 'HR', level: 'europe' },
  '196': { name: 'Кипр', capital: 'Никосия', flag: 'CY', level: 'europe' },
  '203': { name: 'Чехия', capital: 'Прага', flag: 'CZ', level: 'europe' },
  '208': { name: 'Дания', capital: 'Копенгаген', flag: 'DK', level: 'europe' },
  '233': { name: 'Эстония', capital: 'Таллин', flag: 'EE', level: 'europe' },
  '246': { name: 'Финляндия', capital: 'Хельсинки', flag: 'FI', level: 'europe' },
  '250': { name: 'Франция', capital: 'Париж', flag: 'FR', level: 'europe' },
  '276': { name: 'Германия', capital: 'Берлин', flag: 'DE', level: 'europe' },
  '300': { name: 'Греция', capital: 'Афины', flag: 'GR', level: 'europe' },
  '348': { name: 'Венгрия', capital: 'Будапешт', flag: 'HU', level: 'europe' },
  '352': { name: 'Исландия', capital: 'Рейкьявик', flag: 'IS', level: 'europe' },
  '372': { name: 'Ирландия', capital: 'Дублин', flag: 'IE', level: 'europe' },
  '380': { name: 'Италия', capital: 'Рим', flag: 'IT', level: 'europe' },
  '428': { name: 'Латвия', capital: 'Рига', flag: 'LV', level: 'europe' },
  '438': { name: 'Лихтенштейн', capital: 'Вадуц', flag: 'LI', level: 'europe' },
  '440': { name: 'Литва', capital: 'Вильнюс', flag: 'LT', level: 'europe' },
  '442': { name: 'Люксембург', capital: 'Люксембург', flag: 'LU', level: 'europe' },
  '470': { name: 'Мальта', capital: 'Валлетта', flag: 'MT', level: 'europe' },
  '498': { name: 'Молдова', capital: 'Кишинёв', flag: 'MD', level: 'europe' },
  '492': { name: 'Монако', capital: 'Монако', flag: 'MC', level: 'europe' },
  '499': { name: 'Черногория', capital: 'Подгорица', flag: 'ME', level: 'europe' },
  '528': { name: 'Нидерланды', capital: 'Амстердам', flag: 'NL', level: 'europe' },
  '578': { name: 'Норвегия', capital: 'Осло', flag: 'NO', level: 'europe' },
  '616': { name: 'Польша', capital: 'Варшава', flag: 'PL', level: 'europe' },
  '620': { name: 'Португалия', capital: 'Лиссабон', flag: 'PT', level: 'europe' },
  '642': { name: 'Румыния', capital: 'Бухарест', flag: 'RO', level: 'europe' },
  '643': { name: 'Россия', capital: 'Москва', flag: 'RU', level: 'europe' },
  '674': { name: 'Сан-Марино', capital: 'Сан-Марино', flag: 'SM', level: 'europe' },
  '688': { name: 'Сербия', capital: 'Белград', flag: 'RS', level: 'europe' },
  '703': { name: 'Словакия', capital: 'Братислава', flag: 'SK', level: 'europe' },
  '705': { name: 'Словения', capital: 'Любляна', flag: 'SI', level: 'europe' },
  '724': { name: 'Испания', capital: 'Мадрид', flag: 'ES', level: 'europe' },
  '752': { name: 'Швеция', capital: 'Стокгольм', flag: 'SE', level: 'europe' },
  '756': { name: 'Швейцария', capital: 'Берн', flag: 'CH', level: 'europe' },
  '804': { name: 'Украина', capital: 'Киев', flag: 'UA', level: 'europe' },
  '826': { name: 'Великобритания', capital: 'Лондон', flag: 'GB', level: 'europe' },

  // ---------- АЗИЯ ----------
  '051': { name: 'Армения', capital: 'Ереван', flag: 'AM', level: 'asia' },
  '031': { name: 'Азербайджан', capital: 'Баку', flag: 'AZ', level: 'asia' },
  '048': { name: 'Бахрейн', capital: 'Манама', flag: 'BH', level: 'asia' },
  '050': { name: 'Бангладеш', capital: 'Дакка', flag: 'BD', level: 'asia' },
  '064': { name: 'Бутан', capital: 'Тхимпху', flag: 'BT', level: 'asia' },
  '096': { name: 'Бруней', capital: 'Бандар-Сери-Бегаван', flag: 'BN', level: 'asia' },
  '116': { name: 'Камбоджа', capital: 'Пномпень', flag: 'KH', level: 'asia' },
  '156': { name: 'Китай', capital: 'Пекин', flag: 'CN', level: 'asia' },
  '268': { name: 'Грузия', capital: 'Тбилиси', flag: 'GE', level: 'asia' },
  '356': { name: 'Индия', capital: 'Нью-Дели', flag: 'IN', level: 'asia' },
  '360': { name: 'Индонезия', capital: 'Джакарта', flag: 'ID', level: 'asia' },
  '364': { name: 'Иран', capital: 'Тегеран', flag: 'IR', level: 'asia' },
  '368': { name: 'Ирак', capital: 'Багдад', flag: 'IQ', level: 'asia' },
  '376': { name: 'Израиль', capital: 'Иерусалим', flag: 'IL', level: 'asia' },
  '392': { name: 'Япония', capital: 'Токио', flag: 'JP', level: 'asia' },
  '400': { name: 'Иордания', capital: 'Амман', flag: 'JO', level: 'asia' },
  '398': { name: 'Казахстан', capital: 'Астана', flag: 'KZ', level: 'asia' },
  '414': { name: 'Кувейт', capital: 'Эль-Кувейт', flag: 'KW', level: 'asia' },
  '417': { name: 'Киргизия', capital: 'Бишкек', flag: 'KG', level: 'asia' },
  '418': { name: 'Лаос', capital: 'Вьентьян', flag: 'LA', level: 'asia' },
  '422': { name: 'Ливан', capital: 'Бейрут', flag: 'LB', level: 'asia' },
  '458': { name: 'Малайзия', capital: 'Куала-Лумпур', flag: 'MY', level: 'asia' },
  '462': { name: 'Мальдивы', capital: 'Мале', flag: 'MV', level: 'asia' },
  '496': { name: 'Монголия', capital: 'Улан-Батор', flag: 'MN', level: 'asia' },
  '104': { name: 'Мьянма', capital: 'Нейпьидо', flag: 'MM', level: 'asia' },
  '524': { name: 'Непал', capital: 'Катманду', flag: 'NP', level: 'asia' },
  '408': { name: 'КНДР', capital: 'Пхеньян', flag: 'KP', level: 'asia' },
  '512': { name: 'Оман', capital: 'Маскат', flag: 'OM', level: 'asia' },
  '586': { name: 'Пакистан', capital: 'Исламабад', flag: 'PK', level: 'asia' },
  '608': { name: 'Филиппины', capital: 'Манила', flag: 'PH', level: 'asia' },
  '634': { name: 'Катар', capital: 'Доха', flag: 'QA', level: 'asia' },
  '410': { name: 'Южная Корея', capital: 'Сеул', flag: 'KR', level: 'asia' },
  '682': { name: 'Саудовская Аравия', capital: 'Эр-Рияд', flag: 'SA', level: 'asia' },
  '702': { name: 'Сингапур', capital: 'Сингапур', flag: 'SG', level: 'asia' },
  '144': { name: 'Шри-Ланка', capital: 'Коломбо', flag: 'LK', level: 'asia' },
  '760': { name: 'Сирия', capital: 'Дамаск', flag: 'SY', level: 'asia' },
  '762': { name: 'Таджикистан', capital: 'Душанбе', flag: 'TJ', level: 'asia' },
  '764': { name: 'Таиланд', capital: 'Бангкок', flag: 'TH', level: 'asia' },
  '626': { name: 'Восточный Тимор', capital: 'Дили', flag: 'TL', level: 'asia' },
  '792': { name: 'Турция', capital: 'Анкара', flag: 'TR', level: 'asia' },
  '795': { name: 'Туркмения', capital: 'Ашхабад', flag: 'TM', level: 'asia' },
  '784': { name: 'ОАЭ', capital: 'Абу-Даби', flag: 'AE', level: 'asia' },
  '860': { name: 'Узбекистан', capital: 'Ташкент', flag: 'UZ', level: 'asia' },
  '704': { name: 'Вьетнам', capital: 'Ханой', flag: 'VN', level: 'asia' },
  '887': { name: 'Йемен', capital: 'Сана', flag: 'YE', level: 'asia' },

  // ---------- АФРИКА ----------
  '012': { name: 'Алжир', capital: 'Алжир', flag: 'DZ', level: 'africa' },
  '024': { name: 'Ангола', capital: 'Луанда', flag: 'AO', level: 'africa' },
  '204': { name: 'Бенин', capital: 'Порто-Ново', flag: 'BJ', level: 'africa' },
  '072': { name: 'Ботсвана', capital: 'Габороне', flag: 'BW', level: 'africa' },
  '854': { name: 'Буркина-Фасо', capital: 'Уагадугу', flag: 'BF', level: 'africa' },
  '108': { name: 'Бурунди', capital: 'Гитега', flag: 'BI', level: 'africa' },
  '120': { name: 'Камерун', capital: 'Яунде', flag: 'CM', level: 'africa' },
  '132': { name: 'Кабо-Верде', capital: 'Прая', flag: 'CV', level: 'africa' },
  '140': { name: 'ЦАР', capital: 'Банги', flag: 'CF', level: 'africa' },
  '148': { name: 'Чад', capital: 'Нджамена', flag: 'TD', level: 'africa' },
  '174': { name: 'Коморы', capital: 'Морони', flag: 'KM', level: 'africa' },
  '178': { name: 'Республика Конго', capital: 'Браззавиль', flag: 'CG', level: 'africa' },
  '180': { name: 'ДР Конго', capital: 'Киншаса', flag: 'CD', level: 'africa' },
  '262': { name: 'Джибути', capital: 'Джибути', flag: 'DJ', level: 'africa' },
  '818': { name: 'Египет', capital: 'Каир', flag: 'EG', level: 'africa' },
  '226': { name: 'Экваториальная Гвинея', capital: 'Малабо', flag: 'GQ', level: 'africa' },
  '232': { name: 'Эритрея', capital: 'Асмэра', flag: 'ER', level: 'africa' },
  '748': { name: 'Эсватини', capital: 'Мбабане', flag: 'SZ', level: 'africa' },
  '231': { name: 'Эфиопия', capital: 'Аддис-Абеба', flag: 'ET', level: 'africa' },
  '266': { name: 'Габон', capital: 'Либревиль', flag: 'GA', level: 'africa' },
  '270': { name: 'Гамбия', capital: 'Банжул', flag: 'GM', level: 'africa' },
  '288': { name: 'Гана', capital: 'Аккра', flag: 'GH', level: 'africa' },
  '324': { name: 'Гвинея', capital: 'Конакри', flag: 'GN', level: 'africa' },
  '624': { name: 'Гвинея-Бисау', capital: 'Бисау', flag: 'GW', level: 'africa' },
  '384': { name: 'Кот-д’Ивуар', capital: 'Ямусукро', flag: 'CI', level: 'africa' },
  '404': { name: 'Кения', capital: 'Найроби', flag: 'KE', level: 'africa' },
  '426': { name: 'Лесото', capital: 'Масеру', flag: 'LS', level: 'africa' },
  '430': { name: 'Либерия', capital: 'Монровия', flag: 'LR', level: 'africa' },
  '434': { name: 'Ливия', capital: 'Триполи', flag: 'LY', level: 'africa' },
  '450': { name: 'Мадагаскар', capital: 'Антананариву', flag: 'MG', level: 'africa' },
  '454': { name: 'Малави', capital: 'Лилонгве', flag: 'MW', level: 'africa' },
  '466': { name: 'Мали', capital: 'Бамако', flag: 'ML', level: 'africa' },
  '478': { name: 'Мавритания', capital: 'Нуакшот', flag: 'MR', level: 'africa' },
  '480': { name: 'Маврикий', capital: 'Порт-Луи', flag: 'MU', level: 'africa' },
  '504': { name: 'Марокко', capital: 'Рабат', flag: 'MA', level: 'africa' },
  '508': { name: 'Мозамбик', capital: 'Мапуту', flag: 'MZ', level: 'africa' },
  '516': { name: 'Намибия', capital: 'Виндхук', flag: 'NA', level: 'africa' },
  '562': { name: 'Нигер', capital: 'Ниамей', flag: 'NE', level: 'africa' },
  '566': { name: 'Нигерия', capital: 'Абуджа', flag: 'NG', level: 'africa' },
  '646': { name: 'Руанда', capital: 'Кигали', flag: 'RW', level: 'africa' },
  '678': { name: 'Сан-Томе и Принсипи', capital: 'Сан-Томе', flag: 'ST', level: 'africa' },
  '686': { name: 'Сенегал', capital: 'Дакар', flag: 'SN', level: 'africa' },
  '690': { name: 'Сейшелы', capital: 'Виктория', flag: 'SC', level: 'africa' },
  '694': { name: 'Сьерра-Леоне', capital: 'Фритаун', flag: 'SL', level: 'africa' },
  '706': { name: 'Сомали', capital: 'Могадишо', flag: 'SO', level: 'africa' },
  '710': { name: 'ЮАР', capital: 'Претория', flag: 'ZA', level: 'africa' },
  '728': { name: 'Южный Судан', capital: 'Джуба', flag: 'SS', level: 'africa' },
  '729': { name: 'Судан', capital: 'Хартум', flag: 'SD', level: 'africa' },
  '834': { name: 'Танзания', capital: 'Додома', flag: 'TZ', level: 'africa' },
  '768': { name: 'Того', capital: 'Ломе', flag: 'TG', level: 'africa' },
  '788': { name: 'Тунис', capital: 'Тунис', flag: 'TN', level: 'africa' },
  '800': { name: 'Уганда', capital: 'Кампала', flag: 'UG', level: 'africa' },
  '894': { name: 'Замбия', capital: 'Лусака', flag: 'ZM', level: 'africa' },
  '716': { name: 'Зимбабве', capital: 'Хараре', flag: 'ZW', level: 'africa' },

  // ---------- АМЕРИКА ----------
  '032': { name: 'Аргентина', capital: 'Буэнос-Айрес', flag: 'AR', level: 'america' },
  '044': { name: 'Багамы', capital: 'Нассау', flag: 'BS', level: 'america' },
  '052': { name: 'Барбадос', capital: 'Бриджтаун', flag: 'BB', level: 'america' },
  '084': { name: 'Белиз', capital: 'Бельмопан', flag: 'BZ', level: 'america' },
  '068': { name: 'Боливия', capital: 'Сукре', flag: 'BO', level: 'america' },
  '076': { name: 'Бразилия', capital: 'Бразилиа', flag: 'BR', level: 'america' },
  '124': { name: 'Канада', capital: 'Оттава', flag: 'CA', level: 'america' },
  '152': { name: 'Чили', capital: 'Сантьяго', flag: 'CL', level: 'america' },
  '170': { name: 'Колумбия', capital: 'Богота', flag: 'CO', level: 'america' },
  '188': { name: 'Коста-Рика', capital: 'Сан-Хосе', flag: 'CR', level: 'america' },
  '192': { name: 'Куба', capital: 'Гавана', flag: 'CU', level: 'america' },
  '214': { name: 'Доминикана', capital: 'Санто-Доминго', flag: 'DO', level: 'america' },
  '218': { name: 'Эквадор', capital: 'Кито', flag: 'EC', level: 'america' },
  '222': { name: 'Сальвадор', capital: 'Сан-Сальвадор', flag: 'SV', level: 'america' },
  '308': { name: 'Гренада', capital: 'Сент-Джорджес', flag: 'GD', level: 'america' },
  '320': { name: 'Гватемала', capital: 'Гватемала', flag: 'GT', level: 'america' },
  '328': { name: 'Гайана', capital: 'Джорджтаун', flag: 'GY', level: 'america' },
  '332': { name: 'Гаити', capital: 'Порт-о-Пренс', flag: 'HT', level: 'america' },
  '340': { name: 'Гондурас', capital: 'Тегусигальпа', flag: 'HN', level: 'america' },
  '388': { name: 'Ямайка', capital: 'Кингстон', flag: 'JM', level: 'america' },
  '484': { name: 'Мексика', capital: 'Мехико', flag: 'MX', level: 'america' },
  '558': { name: 'Никарагуа', capital: 'Манагуа', flag: 'NI', level: 'america' },
  '591': { name: 'Панама', capital: 'Панама', flag: 'PA', level: 'america' },
  '600': { name: 'Парагвай', capital: 'Асунсьон', flag: 'PY', level: 'america' },
  '604': { name: 'Перу', capital: 'Лима', flag: 'PE', level: 'america' },
  '630': { name: 'Пуэрто-Рико', capital: 'Сан-Хуан', flag: 'PR', level: 'america' },
  '662': { name: 'Сент-Люсия', capital: 'Кастри', flag: 'LC', level: 'america' },
  '780': { name: 'Тринидад и Тобаго', capital: 'Порт-оф-Спейн', flag: 'TT', level: 'america' },
  '840': { name: 'США', capital: 'Вашингтон', flag: 'US', level: 'america' },
  '858': { name: 'Уругвай', capital: 'Монтевидео', flag: 'UY', level: 'america' },
  '862': { name: 'Венесуэла', capital: 'Каракас', flag: 'VE', level: 'america' },

  // ---------- ОКЕАНИЯ ----------
  '036': { name: 'Австралия', capital: 'Канберра', flag: 'AU', level: 'oceania' },
  '242': { name: 'Фиджи', capital: 'Сува', flag: 'FJ', level: 'oceania' },
  '296': { name: 'Кирибати', capital: 'Южная Тарава', flag: 'KI', level: 'oceania' },
  '316': { name: 'Гуам', capital: 'Хагатна', flag: 'GU', level: 'oceania' },
  '520': { name: 'Науру', capital: 'Ярен', flag: 'NR', level: 'oceania' },
  '540': { name: 'Новая Каледония', capital: 'Нумеа', flag: 'NC', level: 'oceania' },
  '554': { name: 'Новая Зеландия', capital: 'Веллингтон', flag: 'NZ', level: 'oceania' },
  '598': { name: 'Папуа — Новая Гвинея', capital: 'Порт-Морсби', flag: 'PG', level: 'oceania' },
  '882': { name: 'Самоа', capital: 'Апиа', flag: 'WS', level: 'oceania' },
  '090': { name: 'Соломоновы Острова', capital: 'Хониара', flag: 'SB', level: 'oceania' },
  '548': { name: 'Вануату', capital: 'Порт-Вила', flag: 'VU', level: 'oceania' },
  '583': { name: 'Микронезия', capital: 'Паликир', flag: 'FM', level: 'oceania' },
  '584': { name: 'Маршалловы Острова', capital: 'Маджуро', flag: 'MH', level: 'oceania' },
  '585': { name: 'Палау', capital: 'Нгерулмуд', flag: 'PW', level: 'oceania' },
  '798': { name: 'Тувалу', capital: 'Фунафути', flag: 'TV', level: 'oceania' },
  '776': { name: 'Тонга', capital: 'Нукуалофа', flag: 'TO', level: 'oceania' }
};

// Минимум 40 ключевых стран: [валюта, язык, население, площадь, факт]
export const COUNTRY_FACTS = {
  '643': ['Российский рубль', 'Русский', '146 млн', '17 098 242 км²', 'Самая большая страна мира, 11 часовых поясов'],
  '840': ['Доллар США', 'Английский', '335 млн', '9 833 517 км²', 'Третья по площади и населению страна мира'],
  '156': ['Юань', 'Китайский', '1,41 млрд', '9 596 961 км²', 'Крупнейшая экономика мира по ППС'],
  '356': ['Рупия', 'Хинди, английский', '1,41 млрд', '3 287 263 км²', 'Самая населённая страна с 2023 года'],
  '076': ['Реал', 'Португальский', '215 млн', '8 515 767 км²', 'Пятая по площади страна мира'],
  '036': ['Австралийский доллар', 'Английский', '26 млн', '7 692 024 км²', 'Единственная страна-континент'],
  '124': ['Канадский доллар', 'Английский, французский', '40 млн', '9 984 670 км²', 'Самая длинная береговая линия в мире'],
  '250': ['Евро', 'Французский', '68 млн', '551 695 км²', 'Самая посещаемая страна мира'],
  '276': ['Евро', 'Немецкий', '84 млн', '357 022 км²', 'Крупнейшая экономика Европы'],
  '380': ['Евро', 'Итальянский', '59 млн', '301 340 км²', 'Здесь находится самое старое учебное заведение Европы'],
  '724': ['Евро', 'Испанский', '48 млн', '505 990 км²', 'Второй по популярности язык в мире'],
  '826': ['Фунт стерлингов', 'Английский', '67 млн', '243 610 км²', 'Крупнейшая империя в истории'],
  '392': ['Иена', 'Японский', '125 млн', '377 975 км²', 'Страна восходящего солнца, 6852 острова'],
  '410': ['Вона', 'Корейский', '52 млн', '100 210 км²', 'Одна из самых технологичных стран мира'],
  '818': ['Египетский фунт', 'Арабский', '110 млн', '1 001 450 км²', 'Пирамиды Гизы — одно из 7 чудес света'],
  '710': ['Рэнд', '11 языков', '60 млн', '1 221 037 км²', 'Три столицы: Претория, Кейптаун, Блумфонтейн'],
  '484': ['Песо', 'Испанский', '129 млн', '1 964 375 км²', 'Родина шоколада и кукурузы'],
  '032': ['Песо', 'Испанский', '46 млн', '2 780 400 км²', 'Родина танго и футболиста Месси'],
  '608': ['Песо', 'Филиппинский, английский', '115 млн', '300 000 км²', '7 641 остров, второй по величине архипелаг'],
  '360': ['Рупия', 'Индонезийский', '278 млн', '1 904 569 км²', 'Крупнейшее островное государство мира'],
  '792': ['Лира', 'Турецкий', '85 млн', '783 562 км²', 'Единственная страна на двух континентах'],
  '364': ['Риал', 'Персидский', '88 млн', '1 648 195 км²', 'Древнейшая цивилизация — Персия'],
  '682': ['Риял', 'Арабский', '36 млн', '2 149 690 км²', 'Крупнейший экспортёр нефти'],
  '784': ['Дирхам', 'Арабский', '10 млн', '83 600 км²', 'Бурдж-Халифа — самое высокое здание мира'],
  '376': ['Шекель', 'Иврит, арабский', '9,7 млн', '22 072 км²', 'Мёртвое море — самая низкая точка Земли'],
  '764': ['Бат', 'Тайский', '71 млн', '513 120 км²', 'Страна улыбок, ни разу не была колонией'],
  '704': ['Донг', 'Вьетнамский', '99 млн', '331 212 км²', 'Второй экспортёр кофе в мире'],
  '586': ['Пакистанская рупия', 'Урду, английский', '240 млн', '881 913 км²', 'Обладает ядерным оружием'],
  '050': ['Така', 'Бенгальский', '170 млн', '147 570 км²', 'Одна из самых густонаселённых стран'],
  '398': ['Тенге', 'Казахский, русский', '19 млн', '2 724 900 км²', 'Крупнейшая страна без выхода к океану'],
  '804': ['Гривна', 'Украинский', '38 млн', '603 628 км²', 'Крупнейшая страна полностью в Европе'],
  '616': ['Злотый', 'Польский', '38 млн', '312 696 км²', 'Здесь родился Шопен и Коперник'],
  '528': ['Евро', 'Нидерландский', '17 млн', '41 850 км²', 'Страна тюльпанов и велосипедов'],
  '056': ['Евро', 'Нидерландский, французский, немецкий', '11 млн', '30 528 км²', 'Европейская столица — Брюссель'],
  '756': ['Швейцарский франк', 'Немецкий, французский, итальянский, романшский', '8,7 млн', '41 284 км²', 'Страна банков и часов'],
  '752': ['Шведская крона', 'Шведский', '10 млн', '450 295 км²', 'Родина IKEA и ABBA'],
  '578': ['Норвежская крона', 'Норвежский', '5,5 млн', '385 207 км²', 'Страна фьордов и полуночного солнца'],
  '246': ['Евро', 'Финский, шведский', '5,5 млн', '338 424 км²', 'Страна тысячи озёр и сауны'],
  '620': ['Евро', 'Португальский', '10 млн', '92 090 км²', 'Родина фаду и портвейна'],
  '300': ['Евро', 'Греческий', '10 млн', '131 957 км²', 'Колыбель западной цивилизации'],
  '008': ['Евро', 'Каталанский', '77 тыс.', '468 км²', 'Одна из самых маленьких стран Европы']
};

// Ачивки
export const ACHIEVEMENTS = [
  {
    id: 'first_game',
    icon: '🎮',
    name: 'Первый шаг',
    desc: 'Сыграйте первую викторину',
    progress: (s) => [Math.min(s.gamesPlayed, 1), 1],
    check: (s) => s.gamesPlayed >= 1
  },
  {
    id: 'five_games',
    icon: '🕹️',
    name: 'Постоянный игрок',
    desc: 'Сыграйте 5 викторин',
    progress: (s) => [Math.min(s.gamesPlayed, 5), 5],
    check: (s) => s.gamesPlayed >= 5
  },
  {
    id: 'twenty_games',
    icon: '🎯',
    name: 'Опытный',
    desc: 'Сыграйте 20 викторин',
    progress: (s) => [Math.min(s.gamesPlayed, 20), 20],
    check: (s) => s.gamesPlayed >= 20
  },
  {
    id: 'fifty_games',
    icon: '🏅',
    name: 'Ветеран',
    desc: 'Сыграйте 50 викторин',
    progress: (s) => [Math.min(s.gamesPlayed, 50), 50],
    check: (s) => s.gamesPlayed >= 50
  },
  {
    id: 'perfect_game',
    icon: '💯',
    name: 'Идеально!',
    desc: '10 из 10 в викторине',
    progress: (s) => [Math.min(s.perfectGames, 1), 1],
    check: (s) => s.perfectGames >= 1
  },
  {
    id: 'perfect_five',
    icon: '⭐',
    name: 'Звёздный игрок',
    desc: '5 идеальных викторин',
    progress: (s) => [Math.min(s.perfectGames, 5), 5],
    check: (s) => s.perfectGames >= 5
  },
  {
    id: 'blitz_master',
    icon: '⚡',
    name: 'Молниеносный',
    desc: 'Идеальный блиц',
    progress: (s) => [Math.min(s.blitzPerfect, 1), 1],
    check: (s) => s.blitzPerfect >= 1
  },
  {
    id: 'streak_5',
    icon: '🔥',
    name: 'На серии',
    desc: 'Streak из 5 ответов',
    progress: (s) => [Math.min(s.maxStreak, 5), 5],
    check: (s) => s.maxStreak >= 5
  },
  {
    id: 'streak_10',
    icon: '💥',
    name: 'Несокрушимый',
    desc: 'Streak из 10 ответов',
    progress: (s) => [Math.min(s.maxStreak, 10), 10],
    check: (s) => s.maxStreak >= 10
  },
  {
    id: 'explorer_10',
    icon: '🧭',
    name: 'Юный путешественник',
    desc: 'Изучите 10 стран',
    progress: (s) => [Math.min(s.exploredCountries.length, 10), 10],
    check: (s) => s.exploredCountries.length >= 10
  },
  {
    id: 'explorer_50',
    icon: '🌍',
    name: 'Географ',
    desc: 'Изучите 50 стран',
    progress: (s) => [Math.min(s.exploredCountries.length, 50), 50],
    check: (s) => s.exploredCountries.length >= 50
  },
  {
    id: 'explorer_100',
    icon: '🗺️',
    name: 'Мастер карт',
    desc: 'Изучите 100 стран',
    progress: (s) => [Math.min(s.exploredCountries.length, 100), 100],
    check: (s) => s.exploredCountries.length >= 100
  },
  {
    id: 'globe_switch',
    icon: '🌐',
    name: 'Двухмерный',
    desc: 'Переключите вид на глобус',
    progress: (s) => [Math.min(s.globeSwitches, 1), 1],
    check: (s) => s.globeSwitches >= 1
  },
  {
    id: 'europe_master',
    icon: '🏰',
    name: 'Знаток Европы',
    desc: 'Идеально в Европе',
    progress: (s) => [s.continentsPerfected.europe ? 1 : 0, 1],
    check: (s) => !!s.continentsPerfected.europe
  },
  {
    id: 'asia_master',
    icon: '🏮',
    name: 'Знаток Азии',
    desc: 'Идеально в Азии',
    progress: (s) => [s.continentsPerfected.asia ? 1 : 0, 1],
    check: (s) => !!s.continentsPerfected.asia
  },
  {
    id: 'africa_master',
    icon: '🦁',
    name: 'Знаток Африки',
    desc: 'Идеально в Африке',
    progress: (s) => [s.continentsPerfected.africa ? 1 : 0, 1],
    check: (s) => !!s.continentsPerfected.africa
  },
  {
    id: 'america_master',
    icon: '🗽',
    name: 'Знаток Америки',
    desc: 'Идеально в Америке',
    progress: (s) => [s.continentsPerfected.america ? 1 : 0, 1],
    check: (s) => !!s.continentsPerfected.america
  },
  {
    id: 'oceania_master',
    icon: '🏝️',
    name: 'Знаток Океании',
    desc: 'Идеально в Океании',
    progress: (s) => [s.continentsPerfected.oceania ? 1 : 0, 1],
    check: (s) => !!s.continentsPerfected.oceania
  },
  {
    id: 'world_master',
    icon: '👑',
    name: 'Покоритель мира',
    desc: 'Идеально по всему миру',
    progress: (s) => [s.continentsPerfected.world ? 1 : 0, 1],
    check: (s) => !!s.continentsPerfected.world
  },
  {
    id: 'score_100',
    icon: '💎',
    name: 'Сотня',
    desc: 'Набрать 100 очков в сумме',
    progress: (s) => [Math.min(s._totalScore || 0, 100), 100],
    check: (s) => (s._totalScore || 0) >= 100
  }
];

export const DAILY_TEMPLATES = [
  { id: 'play_one',      icon: '🎮', name: 'Сыграть 1 викторину', target: 1,  field: 'gamesPlayed' },
  { id: 'explore_five',  icon: '🧭', name: 'Изучить 5 стран',     target: 5,  field: 'explored' },
  { id: 'blitz_one',     icon: '⚡', name: 'Сыграть блиц',        target: 1,  field: 'blitz' },
  { id: 'correct_ten',   icon: '✅', name: '10 верных ответов',   target: 10, field: 'correct' },
  { id: 'streak_three',  icon: '🔥', name: 'Streak из 3',         target: 3,  field: 'streak' }
];

export function getDefaultStats() {
  return {
    gamesPlayed: 0,
    perfectGames: 0,
    blitzPerfect: 0,
    continentsPerfected: {},
    exploredCountries: [],
    globeSwitches: 0,
    countryErrors: {},
    countryCorrect: {},
    maxStreak: 0,
    currentStreak: 0,
    _totalScore: 0
  };
}

export function getMasteryLevel(gamesPlayed) {
  let current = MASTERY_LEVELS[0];
  for (const lvl of MASTERY_LEVELS) {
    if (gamesPlayed >= lvl.minGames) current = lvl;
  }
  return current;
}

export function getNextMasteryLevel(gamesPlayed) {
  for (const lvl of MASTERY_LEVELS) {
    if (gamesPlayed < lvl.minGames) return lvl;
  }
  return null;
}

export function getCountriesByLevel(level) {
  const all = Object.entries(COUNTRIES_DB);
  if (level === 'world') return all.map(([id, c]) => ({ id, ...c }));
  return all.filter(([, c]) => c.level === level).map(([id, c]) => ({ id, ...c }));
}

export function getFlagEmoji(code) {
  if (!code || code.length !== 2) return '🏳️';
  const A = 0x1F1E6;
  const base = 'A'.charCodeAt(0);
  return String.fromCodePoint(
    A + code.charCodeAt(0) - base,
    A + code.charCodeAt(1) - base
  );
}

export { LEVELS, MASTERY_LEVELS };
