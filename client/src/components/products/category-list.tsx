import { Link, useLocation } from "wouter";
import { 
  Smartphone, 
  ShirtIcon, 
  BookOpen, 
  Home, 
  GamepadIcon, 
  Car, 
  Baby, 
  Volleyball, 
  Flower, 
  MoreHorizontal 
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export function CategoryList() {
  const [location, navigate] = useLocation();
  
  const categories: Category[] = [
    { id: "디지털기기", name: "디지털기기", icon: <Smartphone className="text-xl" /> },
    { id: "의류", name: "의류", icon: <ShirtIcon className="text-xl" /> },
    { id: "도서", name: "도서", icon: <BookOpen className="text-xl" /> },
    { id: "가구/인테리어", name: "가구/인테리어", icon: <Home className="text-xl" /> },
    { id: "취미/게임", name: "취미/게임", icon: <GamepadIcon className="text-xl" /> },
    { id: "차량/오토바이", name: "차량/오토바이", icon: <Car className="text-xl" /> },
    { id: "유아동", name: "유아동", icon: <Baby className="text-xl" /> },
    { id: "스포츠/레저", name: "스포츠/레저", icon: <Volleyball className="text-xl" /> },
    { id: "식물", name: "식물", icon: <Flower className="text-xl" /> },
    { id: "기타", name: "기타", icon: <MoreHorizontal className="text-xl" /> },
  ];

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/?category=${encodeURIComponent(categoryId)}`);
  };

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-4">카테고리</h2>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            onClick={() => handleCategoryClick(category.id)}
          >
            <div className="w-12 h-12 flex items-center justify-center bg-primary-100 dark:bg-primary-900 rounded-full text-primary mb-2">
              {category.icon}
            </div>
            <span className="text-sm text-center">{category.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
