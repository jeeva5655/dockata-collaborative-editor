import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, Users, Zap, Shield, Globe, ArrowRight, 
  CheckCircle, Play, Star, Sparkles, Edit3, Share2,
  Clock, Cloud, Lock, Smartphone, Loader2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const navigate = useNavigate()
  const { googleSignIn, continueAsGuest } = useAuth()
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await googleSignIn()
      navigate('/dashboard')
    } catch (error) {
      console.error('Sign in failed:', error)
    }
    setLoading(false)
  }

  const handleGuestAccess = () => {
    setGuestLoading(true)
    continueAsGuest()
    navigate('/dashboard')
  }

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Real-time Collaboration',
      description: 'Work together with your team simultaneously. See changes instantly as they happen.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Lightning Fast Sync',
      description: 'Powered by CRDT technology for conflict-free, instant synchronization.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure & Reliable',
      description: 'Your documents are automatically saved and securely stored in the cloud.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Access Anywhere',
      description: 'Work from any device, anywhere in the world. Your docs are always with you.',
      color: 'from-purple-500 to-pink-500'
    }
  ]

  const capabilities = [
    { icon: <Edit3 className="w-5 h-5" />, text: 'Rich text formatting' },
    { icon: <Users className="w-5 h-5" />, text: 'Multi-user cursors' },
    { icon: <Share2 className="w-5 h-5" />, text: 'Easy sharing' },
    { icon: <Clock className="w-5 h-5" />, text: 'Version history' },
    { icon: <Cloud className="w-5 h-5" />, text: 'Auto-save' },
    { icon: <Lock className="w-5 h-5" />, text: 'Secure access' },
    { icon: <Smartphone className="w-5 h-5" />, text: 'Mobile friendly' },
    { icon: <Zap className="w-5 h-5" />, text: 'Instant sync' }
  ]

  const testimonials = [
    {
      quote: "DocKata transformed how our team collaborates. It's faster than Google Docs!",
      author: "Sarah Chen",
      role: "Product Manager, TechCorp",
      avatar: "SC"
    },
    {
      quote: "The real-time sync is incredible. No more version conflicts or lost changes.",
      author: "James Wilson",
      role: "Engineering Lead, StartupXYZ",
      avatar: "JW"
    },
    {
      quote: "Simple, fast, and reliable. Exactly what we needed for remote collaboration.",
      author: "Emily Rodriguez",
      role: "Content Director, MediaHub",
      avatar: "ER"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DocKata</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How it works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleGuestAccess}
                disabled={guestLoading}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Try as Guest
              </button>
              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Real-time collaboration made simple
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Write together,{' '}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  in real-time
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Create, edit, and collaborate on documents with your team instantly. 
                No more version conflicts, no more waiting. Just seamless collaboration.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-900 font-semibold rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </button>
                <button 
                  onClick={handleGuestAccess}
                  disabled={guestLoading}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                >
                  {guestLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start as Guest'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {['#3B82F6', '#10B981', '#F59E0B', '#EF4444'].map((color, i) => (
                    <div 
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white font-medium text-sm"
                      style={{ backgroundColor: color }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600">Trusted by 10,000+ teams</p>
                </div>
              </div>
            </div>

            {/* Hero Image / Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Mock Editor Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Project Proposal.doc</span>
                    </div>
                    <div className="flex -space-x-2">
                      {['#3B82F6', '#10B981', '#F59E0B'].map((color, i) => (
                        <div 
                          key={i}
                          className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                          style={{ backgroundColor: color }}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Mock Editor Toolbar */}
                <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2">
                  <select className="text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1">
                    <option>Arial</option>
                  </select>
                  <select className="text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 w-16">
                    <option>12</option>
                  </select>
                  <div className="w-px h-5 bg-gray-200 mx-1" />
                  <button className="p-1.5 hover:bg-gray-100 rounded font-bold text-sm">B</button>
                  <button className="p-1.5 hover:bg-gray-100 rounded italic text-sm">I</button>
                  <button className="p-1.5 hover:bg-gray-100 rounded underline text-sm">U</button>
                </div>

                {/* Mock Editor Content */}
                <div className="p-6 min-h-[300px] text-gray-800">
                  <h2 className="text-2xl font-bold mb-4">Q4 Marketing Strategy</h2>
                  <p className="mb-3 text-gray-600">
                    Our team has been working on the new marketing initiative for the upcoming quarter. 
                    Here are the key highlights:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Expand social media presence by 40%</li>
                    <li>Launch influencer partnership program<span className="inline-block w-0.5 h-5 bg-blue-500 animate-pulse ml-0.5" /></li>
                    <li className="text-gray-400">Target new demographics...</li>
                  </ul>
                  
                  {/* Collaborative cursor */}
                  <div className="absolute bottom-20 right-12 flex items-center gap-1">
                    <div className="w-0.5 h-5 bg-green-500 animate-pulse" />
                    <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">Sarah</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Bar */}
      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {capabilities.map((cap, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-600">
                <span className="text-blue-600">{cap.icon}</span>
                <span className="text-sm font-medium">{cap.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to collaborate
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make team collaboration effortless and enjoyable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get started in seconds
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No complicated setup. Just click and start collaborating.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create a document', desc: 'Click the "New Document" button to start a fresh document instantly.' },
              { step: '02', title: 'Share the link', desc: 'Copy and share your document link with teammates to collaborate.' },
              { step: '03', title: 'Edit together', desc: 'See everyone\'s changes in real-time with colored cursors and names.' }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-7xl font-bold text-blue-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2">
                    <ArrowRight className="w-8 h-8 text-blue-200" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by teams worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our users have to say about their experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex items-center gap-1 text-yellow-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-medium">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to transform your workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using DocKata to collaborate more effectively.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl shadow-lg transition-all hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button 
              onClick={handleGuestAccess}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl shadow-lg transition-all hover:-translate-y-0.5"
            >
              Try as Guest
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-blue-200 mt-4 text-sm">No credit card required • Free forever</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DocKata</span>
            </div>
            
            <div className="flex items-center gap-8 text-gray-400 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            <p className="text-gray-500 text-sm">
              © 2026 DocKata. Made for GUVI Hackathon.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
