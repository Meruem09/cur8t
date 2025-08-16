'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { PiArrowLeft, PiArrowRight, PiCheck, PiUser } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: string; // Path to image
  actionText?: string;
  onAction?: () => void;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  username?: string;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to Cur8t! 🎉',
    description:
      "Organize, discover, and share your knowledge with the world. Let's get you started with a quick tour of what makes Cur8t special.",
    image: '/images/onboarding/welcome.png',
  },
  {
    id: 'collections',
    title: 'Organize with Collections',
    description:
      'Create collections to group related links, articles, and resources. Keep your knowledge organized and easily accessible.',
    image: '/images/onboarding/collections.png',
  },
  {
    id: 'sharing',
    title: 'Share & Discover',
    description:
      'Make your collections public to share knowledge with others, or keep them private for personal use. Discover amazing collections from the community.',
    image: '/images/onboarding/sharing.png',
  },
  {
    id: 'integrations',
    title: 'Powerful Integrations',
    description:
      'Connect with GitHub, use our browser extension, and sync your data across devices. Cur8t works wherever you do.',
    image: '/images/onboarding/integrations.png',
  },
  {
    id: 'username',
    title: 'Choose Your Username',
    description:
      'This will be your public profile and how others can find your collections.',
    image: '/images/onboarding/username.png',
  },
];

export function OnboardingFlow({ onComplete, username }: OnboardingFlowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    skipSnaps: false,
    dragFree: false,
  });

  // Username setup state
  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) {
        emblaApi.scrollTo(index);
        setCurrentSlide(index);
      }
    },
    [emblaApi]
  );

  const scrollNext = useCallback(() => {
    if (emblaApi && currentSlide < onboardingSlides.length - 1) {
      emblaApi.scrollNext();
      setCurrentSlide(currentSlide + 1);
    }
  }, [emblaApi, currentSlide]);

  const scrollPrev = useCallback(() => {
    if (emblaApi && currentSlide > 0) {
      emblaApi.scrollPrev();
      setCurrentSlide(currentSlide - 1);
    }
  }, [emblaApi, currentSlide]);

  const generateRandomUsername = () => {
    const adjectives = [
      'clever',
      'bright',
      'quick',
      'smart',
      'cool',
      'super',
      'amazing',
      'awesome',
    ];
    const nouns = [
      'user',
      'person',
      'maker',
      'builder',
      'creator',
      'explorer',
      'wizard',
      'ninja',
    ];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999);
    return `${adjective}${noun}${number}`;
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate username
    if (!usernameInput || usernameInput.length < 3) {
      setError('Username must be at least 3 characters long');
      setIsLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(usernameInput)) {
      setError('Username can only contain letters, numbers, and underscores');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameInput }),
      });

      // Check for rate limiting first
      if (response.status === 429) {
        const data = await response.json();
        const retryAfter =
          response.headers.get('retry-after') || data.retryAfter || 60;

        const { showRateLimitToast } = await import(
          '@/components/ui/rate-limit-toast'
        );
        showRateLimitToast({
          retryAfter:
            typeof retryAfter === 'string'
              ? parseInt(retryAfter) * 60
              : retryAfter * 60,
          message: 'Too many username change attempts. Please try again later.',
        });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set username');
      }

      // Username set successfully, complete onboarding
      onComplete();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    if (currentSlide === onboardingSlides.length - 1) {
      // On the username slide, don't auto-complete - wait for username submission
      return;
    } else {
      scrollNext();
    }
  };

  const isUsernameSlide = currentSlide === onboardingSlides.length - 1;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Main Content - Fits in one view */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-7xl w-full">
          <div className="embla" ref={emblaRef}>
            <div className="embla__container">
              {onboardingSlides.map((slide, index) => (
                <div key={slide.id} className="embla__slide flex-[0_0_100%]">
                  <div className="flex items-center justify-center h-full">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 items-center max-w-6xl">
                      {/* Left Side - Content */}
                      <div className="space-y-8 text-center xl:text-left">
                        <div className="space-y-6">
                          <h1 className="text-4xl xl:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                            {slide.title}
                          </h1>
                          <p className="text-lg xl:text-xl text-muted-foreground leading-relaxed max-w-xl">
                            {slide.description}
                          </p>
                        </div>

                        {/* Username Form - Only show on username slide */}
                        {isUsernameSlide && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="pt-4"
                          >
                            <form
                              onSubmit={handleUsernameSubmit}
                              className="space-y-4"
                            >
                              <div className="space-y-2">
                                <Label
                                  htmlFor="username"
                                  className="text-base font-medium"
                                >
                                  Username
                                </Label>
                                <Input
                                  id="username"
                                  type="text"
                                  value={usernameInput}
                                  onChange={(e) =>
                                    setUsernameInput(e.target.value)
                                  }
                                  placeholder="Enter your username"
                                  className="h-11 text-base"
                                />
                              </div>

                              {error && (
                                <Alert variant="destructive">
                                  <AlertDescription>{error}</AlertDescription>
                                </Alert>
                              )}

                              <div className="space-y-3 pt-2">
                                <Button
                                  type="submit"
                                  size="lg"
                                  disabled={isLoading}
                                  className="w-full px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                  {isLoading ? (
                                    <div className="flex items-center space-x-2">
                                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      <span>Setting Username...</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <PiCheck className="h-5 w-5" />
                                      <span>Complete Setup</span>
                                    </div>
                                  )}
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() =>
                                    setUsernameInput(generateRandomUsername())
                                  }
                                  className="w-full h-11"
                                >
                                  🎲 Generate Random Username
                                </Button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </div>

                      {/* Right Side - Image */}
                      <div className="flex items-center justify-center">
                        <div className="relative group">
                          {/* Image Container with Modern Styling */}
                          <div className="relative w-80 h-80 xl:w-96 xl:h-96 rounded-2xl overflow-hidden shadow-2xl group-hover:shadow-3xl transition-all duration-500">
                            {/* Placeholder for now - replace with actual Image component */}
                            <div className="w-full h-full bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 flex items-center justify-center border border-border/20">
                              <div className="text-center space-y-3">
                                <div className="text-6xl">🖼️</div>
                                <div className="text-sm text-muted-foreground font-medium">
                                  {slide.image
                                    .split('/')
                                    .pop()
                                    ?.replace('.png', '')}
                                </div>
                              </div>
                            </div>

                            {/* Uncomment this when you have actual images */}
                            {/* <Image
                              src={slide.image}
                              alt={slide.title}
                              fill
                              className="object-cover"
                              priority
                            /> */}
                          </div>

                          {/* Decorative Elements */}
                          <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl blur-2xl -z-10 group-hover:blur-3xl transition-all duration-500" />
                          <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full opacity-60 animate-pulse" />
                          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-accent rounded-full opacity-60 animate-pulse delay-1000" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation & Progress - Fixed at bottom */}
      <div className="border-t border-border/10 p-8 bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          {/* Progress Bar */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2">
              {onboardingSlides.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-12 rounded-full transition-all duration-500 ${
                    index <= currentSlide
                      ? 'bg-primary/40'
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={scrollPrev}
              disabled={currentSlide === 0}
              className="flex items-center space-x-3 px-6 py-3 text-base font-medium hover:bg-muted/50 transition-all duration-200"
            >
              <PiArrowLeft className="h-5 w-5" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-4">
              {currentSlide === onboardingSlides.length - 1 ? (
                <div className="text-sm text-muted-foreground">
                  Complete username setup above to continue
                </div>
              ) : (
                <Button
                  onClick={scrollNext}
                  className="flex items-center space-x-3 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <span>Next</span>
                  <PiArrowRight className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
