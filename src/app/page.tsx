import { getSettings } from "@/lib/store/settings";
import { listCategories } from "@/lib/store/categories";
import { listMenuItems } from "@/lib/store/menu";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { HoursStrip } from "@/components/site/HoursStrip";
import { MenuSection } from "@/components/site/MenuSection";
import { OrderingSteps } from "@/components/site/OrderingSteps";
import { RoomGallery } from "@/components/site/RoomGallery";
import { VisitSection } from "@/components/site/VisitSection";
import { Footer } from "@/components/site/Footer";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const settings = getSettings();
  const categories = listCategories();
  const items = listMenuItems();

  return (
    <>
      <Header cafeName={settings.name} />
      <Hero settings={settings} />
      <HoursStrip settings={settings} />
      <MenuSection categories={categories} items={items} />
      <OrderingSteps />
      <RoomGallery />
      <VisitSection settings={settings} />
      <Footer settings={settings} />
    </>
  );
}
