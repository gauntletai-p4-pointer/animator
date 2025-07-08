import SpineViewer from '@/components/SpineViewer';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold" style={{ color: 'var(--foreground)' }}>Spine2D Animation Demo</h1>
          <ThemeToggle />
        </div>
        <SpineViewer />
      </div>
    </div>
  );
}
