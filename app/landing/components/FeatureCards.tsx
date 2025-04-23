import Image from "next/image";

export default function FeatureCards() {
  return (
    <section className="w-full bg-black text-white py-20">
      {/* Feature Cards */}
      <div className="container mx-auto px-4 mb-20">
        <h2 className="text-4xl mb-12 text-center">Experience AI-Powered Learning</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Card 1 */}
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-3">Interactive Q&A</h3>
              <p className="text-zinc-400 mb-6">
                Ask questions about your lecture material and receive instant, accurate responses tailored to your course content.
              </p>
            </div>
            <div className="relative h-[400px] w-full bg-zinc-800 overflow-hidden">
              <Image 
                src="/imgs/source-ex.jpg" 
                alt="Interactive Q&A interface showing a conversation with the AI about course material"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-3">Study Companion</h3>
              <p className="text-zinc-400 mb-6">
                Generate summaries, flashcards, and practice questions from your lecture notes and course materials.
              </p>
            </div>
            <div className="relative h-[300px] w-full bg-zinc-800 overflow-hidden">
              <Image 
                src="/placeholder.svg?height=600&width=800" 
                alt="Study companion interface showing generated flashcards and summaries"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                <span className="text-sm text-zinc-400 bg-zinc-900/80 px-3 py-1 rounded-full">
                  AI-generated study materials
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="container mx-auto px-4">
        <div className="bg-zinc-900/50 rounded-2xl p-8 md:p-12 border border-zinc-800">
          <h2 className="text-4xl font-bold mb-12 text-center">How Our AI Enhances Your Learning</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 transition-all hover:border-blue-500/30">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Course-Specific Knowledge</h3>
              <p className="text-zinc-400">
                Our AI is trained on your specific course materials, textbooks, and lecture notes, ensuring accurate and relevant responses.
              </p>
            </div>
            
            <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 transition-all hover:border-blue-500/30">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">24/7 Availability</h3>
              <p className="text-zinc-400">
                Get help whenever you need it, day or night. No office hours or waiting for email responses from TAs.
              </p>
            </div>
            
            <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 transition-all hover:border-blue-500/30">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Personalized Learning</h3>
              <p className="text-zinc-400">
                The more you interact, the better it understands your learning style and knowledge gaps, providing tailored assistance.
              </p>
            </div>
          </div>
          
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 transition-all hover:border-blue-500/30">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Canvas Integration</h3>
              <p className="text-zinc-400">
                Seamlessly integrates with your Canvas LMS, accessing your assignments, readings, and course materials to provide context-aware assistance.
              </p>
            </div>
            
            <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 transition-all hover:border-blue-500/30">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Privacy-Focused</h3>
              <p className="text-zinc-400">
                Your conversations and data are secure and private. We don't store your personal information or share your learning data with third parties.
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <a href="#" className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Start Learning Smarter
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
