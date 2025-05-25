export const theme = {
  animations: {
    // Smooth spring animations
    spring: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30 
    },
    // Bouncy spring
    bouncy: {
      type: "spring",
      stiffness: 400,
      damping: 10
    },
    // Smooth transition
    smooth: {
      type: "tween",
      duration: 0.3,
      ease: "easeInOut"
    },
    // Stagger children for lists
    stagger: { 
      staggerChildren: 0.1 
    },
    staggerFast: {
      staggerChildren: 0.05
    },
    // Page transitions
    pageTransition: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3 }
    },
    // Card hover
    cardHover: {
      scale: 1.05,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    // Float animation
    float: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  
  effects: {
    // Glassmorphism variations
    glass: "backdrop-blur-xl bg-white/10 border border-white/20",
    glassDark: "backdrop-blur-xl bg-black/20 border border-white/10",
    glassLight: "backdrop-blur-md bg-white/30 border border-white/40",
    
    // Neon glow effects
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.5)]",
    glowStrong: "shadow-[0_0_50px_rgba(59,130,246,0.8)]",
    glowPurple: "shadow-[0_0_30px_rgba(147,51,234,0.5)]",
    glowGreen: "shadow-[0_0_30px_rgba(34,197,94,0.5)]",
    
    // Gradient borders
    gradientBorder: "bg-gradient-to-r from-blue-500 to-purple-600",
    gradientBorderPink: "bg-gradient-to-r from-pink-500 to-purple-600",
    gradientBorderGreen: "bg-gradient-to-r from-green-500 to-blue-600",
    
    // Text gradients
    textGradient: "bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent",
    textGradientPink: "bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent",
    
    // Shadows
    shadowElevated: "shadow-2xl shadow-black/20",
    shadowFloat: "shadow-[0_20px_50px_rgba(0,0,0,0.3)]",
    
    // 3D effects
    tilt3d: "transform-gpu perspective-1000",
    
    // Animated gradients
    animatedGradient: "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-[length:200%_auto] animate-gradient"
  },
  
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    accent: {
      purple: '#9333ea',
      pink: '#ec4899',
      cyan: '#06b6d4',
      emerald: '#10b981',
    }
  },
  
  spacing: {
    section: 'py-20 px-4 sm:px-6 lg:px-8',
    container: 'max-w-7xl mx-auto',
    card: 'p-6 sm:p-8',
  },
  
  typography: {
    heading: 'font-bold tracking-tight',
    subheading: 'font-semibold text-gray-600 dark:text-gray-400',
    body: 'text-gray-700 dark:text-gray-300 leading-relaxed',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
};

// Tailwind animation extensions
export const tailwindAnimations = {
  animation: {
    'gradient': 'gradient 3s ease infinite',
    'float': 'float 3s ease-in-out infinite',
    'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
    'slide-up': 'slide-up 0.3s ease-out',
    'slide-down': 'slide-down 0.3s ease-out',
    'fade-in': 'fade-in 0.3s ease-out',
    'spin-slow': 'spin 3s linear infinite',
  },
  keyframes: {
    gradient: {
      '0%, 100%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
    },
    float: {
      '0%, 100%': { transform: 'translateY(0px)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    'pulse-glow': {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    'slide-up': {
      '0%': { transform: 'translateY(10px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    'slide-down': {
      '0%': { transform: 'translateY(-10px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    'fade-in': {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
  }
};