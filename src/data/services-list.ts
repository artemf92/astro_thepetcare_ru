// Список услуг для главной страницы и навигации

export interface ServiceItem {
  title:   string;
  slug:    string;
  price:   string;
  imageId: string;
  image:   string; // путь к файлу в public/images/uploads/
}

export interface ServiceCategory {
  category: string;
  items:    ServiceItem[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    category: "Для собак",
    items: [
      { title: "Стрижка питомцев",         slug: "strizhka-sobak",            price: "от 1600 ₽", imageId: "11056", image: "/images/uploads/11056.webp" },
      { title: "Экспресс-линька",           slug: "ekspress-linka-dlya-sobak", price: "от 1600 ₽", imageId: "11416", image: "/images/uploads/11416.webp" },
      { title: "Гигиена",                   slug: "gigiena-dlya-sobak",        price: "от 1400 ₽", imageId: "11388", image: "/images/uploads/11388.webp" },
      { title: "Уходы",                     slug: "spa-procedury-dlya-sobak",  price: "от 1400 ₽",  imageId: "11054", image: "/images/uploads/11054.webp" },
      { title: "Мытье и сушка",             slug: "myte-i-sushka-koshek",      price: "от 1400 ₽", imageId: "11389", image: "/images/uploads/11389.webp" },
      { title: "Полный комплекс для собак", slug: "polnyy-kompleks-dlya-sobak",price: "от 1600 ₽", imageId: "11412", image: "/images/uploads/11412.webp" },
      { title: "Чистка зубов собакам",      slug: "chistka-zubov-sobakam",     price: "от 300 ₽",  imageId: "11400", image: "/images/uploads/11400.webp" },
      { title: "Стрижка когтей",            slug: "strizhka-kogtey-sobakam",   price: "от 200 ₽",  imageId: "11059", image: "/images/uploads/11059.webp" },
    ],
  },
  {
    category: "Для кошек",
    items: [
      { title: "Экспресс-линька",           slug: "ekspress-linka-dlya-koshek",   price: "от 1500 ₽", imageId: "11055", image: "/images/uploads/11055.webp" },
      { title: "Стрижка кошек",             slug: "polnyy-kompleks-dlya-koshek",  price: "от 1800 ₽", imageId: "11264", image: "/images/uploads/11264.webp" },
      { title: "Стрижка когтей",            slug: "strizhka-kogtey-koshkam",      price: "от 200 ₽",  imageId: "11251", image: "/images/uploads/11251.webp" },
      { title: "Комплекс для лысых пород",  slug: "spa-procedury-dlya-koshek",    price: "от 1000 ₽", imageId: "11420", image: "/images/uploads/11420.webp" },
      { title: "Мытье и сушка",             slug: "myte-i-sushka-koshek",         price: "от 2000 ₽", imageId: "11580", image: "/images/uploads/11580.webp" },
    ],
  },
];

export const allServices: ServiceItem[] =
  serviceCategories.flatMap(c => c.items);
