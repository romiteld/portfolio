export const theme = {
  colors: {
    primary: "rgb(59, 130, 246)", // Blue
    secondary: "rgb(168, 85, 247)", // Purple
    accent: "rgb(34, 197, 94)", // Green
    background: "rgb(0, 0, 0)",
    surface: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.1)",
    text: {
      primary: "rgb(255, 255, 255)",
      secondary: "rgba(255, 255, 255, 0.7)",
      muted: "rgba(255, 255, 255, 0.5)",
    },
    gradient: {
      primary: "linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(168, 85, 247) 100%)",
      secondary: "linear-gradient(135deg, rgb(168, 85, 247) 0%, rgb(236, 72, 153) 100%)",
      accent: "linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(59, 130, 246) 100%)",
      rainbow: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
    },
    status: {
      success: "rgb(34, 197, 94)",
      warning: "rgb(245, 158, 11)",
      error: "rgb(239, 68, 68)",
      info: "rgb(59, 130, 246)",
    }
  },
  
  effects: {
    glass: "backdrop-blur-xl bg-white/5 border border-white/10",
    glassDark: "backdrop-blur-xl bg-black/20 border border-white/10",
    glassLight: "backdrop-blur-md bg-white/10 border border-white/20",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.5)]",
    glowStrong: "shadow-[0_0_50px_rgba(59,130,246,0.8)]",
    glowPrimary: "shadow-[0_0_30px_rgba(59,130,246,0.5)]",
    glowSecondary: "shadow-[0_0_30px_rgba(168,85,247,0.5)]",
    glowAccent: "shadow-[0_0_30px_rgba(34,197,94,0.5)]",
    gradient: "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
    gradientRadial: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]",
    shadowElevated: "shadow-2xl shadow-black/20",
    shadowFloat: "shadow-[0_20px_50px_rgba(0,0,0,0.3)]",
    textGradient: "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent",
    border: "border border-white/10",
    borderGlow: "border border-blue-500/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]",
  },
  
  animations: {
    spring: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30 
    },
    springBouncy: {
      type: "spring",
      stiffness: 400,
      damping: 10
    },
    smooth: { 
      duration: 0.3, 
      ease: "easeInOut" 
    },
    smoothSlow: {
      duration: 0.6,
      ease: "easeInOut"
    },
    stagger: {
      staggerChildren: 0.1
    },
    staggerFast: {
      staggerChildren: 0.05
    },
    float: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    rotate: {
      rotate: 360,
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3 }
    },
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
      transition: { duration: 0.3 }
    },
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
      transition: { duration: 0.2 }
    },
  },
  
  spacing: {
    xs: "0.5rem",
    sm: "1rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "3rem",
    "2xl": "4rem",
    section: "py-20 px-4 sm:px-6 lg:px-8",
    container: "max-w-7xl mx-auto",
    card: "p-6 sm:p-8",
  },
  
  typography: {
    h1: "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight",
    h2: "text-3xl sm:text-4xl font-bold tracking-tight",
    h3: "text-2xl sm:text-3xl font-semibold",
    h4: "text-xl sm:text-2xl font-semibold",
    body: "text-base leading-relaxed",
    small: "text-sm",
    tiny: "text-xs",
  },
  
  borderRadius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.5rem",
    full: "9999px",
  },
  
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    modal: 30,
    popover: 40,
    overlay: 50,
    tooltip: 60,
    notification: 70,
  }
};

// Tailwind class combinations for common patterns
export const patterns = {
  card: `${theme.effects.glass} ${theme.effects.shadowElevated} rounded-xl overflow-hidden`,
  button: {
    primary: "bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 transition-all hover:scale-105 active:scale-95",
    secondary: "bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg px-4 py-2 transition-all hover:scale-105 active:scale-95",
    ghost: "hover:bg-white/10 text-white font-medium rounded-lg px-4 py-2 transition-all",
  },
  input: `${theme.effects.glass} ${theme.effects.border} rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-500/50 focus:shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] transition-all`,
  gradient: {
    mesh: "bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-blue-600 via-purple-600 to-pink-600",
    radial: "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600 via-purple-600 to-transparent",
  }
};

// Animation keyframes for CSS
export const keyframes = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { opacity: 1; box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
    50% { opacity: 0.8; box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
  }
  
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;