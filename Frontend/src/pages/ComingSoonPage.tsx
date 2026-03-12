import { useState, useEffect } from 'react';

const ComingSoonPage = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Set the launch date
  const launchDate = new Date('2025-09-10T00:00:00').getTime();

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [launchDate]);

  return (
    <div className="flex w-full flex-col items-center justify-center h-[calc(100vh-60px)] bg-gradient-to-r from-primary to-secondary">
      <div className="mb-8 animate-bounce">
        <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8V12m0 4h.01M21 12a9 9 0 10-9 9 9 9 0 009-9z"></path>
        </svg>
      </div>

      <h1 className="text-5xl font-bold text-white mb-4 animate-fadeIn">Coming Soon!</h1>
      <p className="text-lg text-white mb-8">We’re working hard to bring you something amazing. Stay tuned!</p>

      {/* Countdown Timer */}
      <div className="grid grid-cols-4 gap-4 text-white text-center animate-fadeIn">
        <div>
          <p className="text-6xl font-bold">{timeLeft.days}</p>
          <p className="text-lg">Days</p>
        </div>
        <div>
          <p className="text-6xl font-bold">{timeLeft.hours}</p>
          <p className="text-lg">Hours</p>
        </div>
        <div>
          <p className="text-6xl font-bold">{timeLeft.minutes}</p>
          <p className="text-lg">Minutes</p>
        </div>
        <div>
          <p className="text-6xl font-bold">{timeLeft.seconds}</p>
          <p className="text-lg">Seconds</p>
        </div>
      </div>

      <button className="mt-8 bg-white text-primary-600 font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300">
        Notify Me!
      </button>
    </div>
  );
};

export default ComingSoonPage;
