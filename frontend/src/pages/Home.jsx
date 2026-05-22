import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import CurriculumSection from '../components/CurriculumSection';
import Benefits from '../components/Benefits';
import CourseSection from '../components/CourseSection';
import BonusSection from '../components/BonusSection';
import PaymentMethods from '../components/PaymentMethods';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <CurriculumSection />
        <CourseSection />
        <Benefits />
        <BonusSection />
        <PaymentMethods />
      </main>
      <Footer />
    </div>
  );
}