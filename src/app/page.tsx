import SpineAnimator from '@/components/SpineAnimator';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="absolute top-4 left-84 z-20">
        {/* <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          Spine2D Animation Studio
        </h1> */}
        {/* <ThemeToggle /> */}
      </div>
      <SpineAnimator />
    </div>
  );
}
