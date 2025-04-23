'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    const testimonials = [
        {
            quote: '"This AI saved my GPA."',
            author: 'Alex J., Computer Science'
        },
        {
            quote: '"It knew my syllabus better than I did."',
            author: 'Taylor M., Biology'
        },
        {
            quote: '"Way more helpful than office hours."',
            author: 'Jordan K., Business'
        },
        {
            quote: '"10/10. Would recommend to any stressed-out student."',
            author: 'Sam R., Engineering'
        }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header/Navigation */}
            <header className="w-full py-4 px-6 md:px-12 flex justify-between items-center">
                <div className="font-mono text-2xl">Team MHE</div>
                <nav className="hidden md:flex space-x-8">
                    <Link href="#features" className="hover:text-green-500 transition">Features</Link>
                    <Link href="#testimonials" className="hover:text-green-500 transition">Testimonials</Link>
                    <Link href="#pricing" className="hover:text-green-500 transition">Pricing</Link>
                </nav>
                <div>
                    <button className="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition">Sign In</button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="w-full py-16 md:py-24 px-6 md:px-12 flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 space-y-6 mb-12 md:mb-0">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
                        Meet Your Smartest Study Buddy.
                    </h1>
                    <h2 className="text-xl md:text-2xl text-gray-600">
                        An AI course assistant that's always one step ahead.
                    </h2>
                    <p className="text-lg text-gray-500">
                        Ask questions. Get instant answers. Stay on top of your coursework — effortlessly.
                    </p>
                    <Button className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-6 text-lg rounded-md cursor-pointer">
                        Chat now
                        <ArrowRight className="ml-4 h-5 w-5" />
                    </Button>
                </div>
                <div className="md:w-1/2 flex justify-center">
                    <div className="relative w-full max-w-md h-[400px] bg-gray-100 rounded-lg shadow-xl overflow-hidden">
                        <div className="absolute top-0 w-full h-10 bg-gray-200 flex items-center px-4">
                            <div className="flex space-x-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                        </div>
                        <div className="pt-10 px-4 h-full bg-white">
                            <div className="flex flex-col h-full">
                                <div className="p-3 bg-gray-100 rounded-lg mb-2 self-start max-w-[80%]">
                                    Can you explain the concept of neural networks?
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg mb-2 self-end max-w-[80%]">
                                    Sure! Neural networks are computing systems inspired by the human brain. They consist of layers of nodes (neurons) that process information and learn patterns...
                                </div>
                                <div className="p-3 bg-gray-100 rounded-lg mb-2 self-start max-w-[80%]">
                                    How does that relate to my CS 101 assignment?
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg self-end max-w-[80%]">
                                    Based on your CS 101 syllabus, your current assignment focuses on implementing a simple neural network in Python. Let me help you break down the requirements...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Value Proposition */}
            <section className="w-full py-16 px-6 md:px-12 bg-gray-50">
                <div className="max-w-5xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">AI That Speaks Your Course's Language</h2>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Trained specifically on your course materials — lectures, notes, assignments, and quizzes — so answers are always on point.
                    </p>
                </div>
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
                    {/* Document-style Card 1 */}
                    <div className="max-w-lg mx-auto bg-white rounded-lg overflow-hidden border-2 border-gray-200">
                        {/* Image fills the whole top part with 4:5 aspect ratio */}
                        <div className="w-full">
                            <Image
                                src="/imgs/source-ex.jpg"
                                width={1000}
                                height={800}
                                alt="Document connections diagram"
                                className="w-full object-cover aspect-[5/4]"
                            />
                        </div>

                        {/* Bottom part with text */}
                        <div className="p-8 bg-zinc-800 text-white">
                            <h2 className="text-3xl font-medium mb-3">Multi-Source Support</h2>
                            <p className="text-base">
                                Ask complex questions across up to 50 documents, unlocking insights in your organization's data.
                            </p>
                        </div>
                    </div>

                    {/* Document-style Card 2 */}
                    <div className="max-w-lg mx-auto bg-white rounded-lg overflow-hidden border-2 border-gray-200">
                        {/* Image fills the whole top part with 4:5 aspect ratio */}
                        <div className="w-full">
                            <Image
                                src="/imgs/citation-ex.jpg"
                                width={1000}
                                height={800}
                                alt="Document connections diagram"
                                className="w-full object-cover aspect-[5/4]"
                            />
                        </div>

                        {/* Bottom part with text */}
                        <div className="p-8 bg-zinc-800 text-white">
                            <h2 className="text-3xl font-medium mb-3">Multi-Source Support</h2>
                            <p className="text-base">
                                Ask complex questions across up to 50 documents, unlocking insights in your organization's data.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Key Features */}
            <section id="features" className="w-full py-16 px-6 md:px-12">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Key Features</h2>

                {/* Canvas LMS Integration */}
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center mb-24">
                    <div className="md:w-1/2 mb-8 md:mb-0 md:pr-12">
                        <h3 className="text-2xl font-bold mb-4">Canvas LMS Integration</h3>
                        <p className="text-lg text-gray-600 mb-6">
                            Automatically syncs with your Canvas dashboard to keep answers relevant and up to date.
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-center">
                                <span className="mr-2 text-green-500">✓</span>
                                <span>Instant access to your course materials</span>
                            </li>
                            <li className="flex items-center">
                                <span className="mr-2 text-green-500">✓</span>
                                <span>Assignment deadline reminders</span>
                            </li>
                            <li className="flex items-center">
                                <span className="mr-2 text-green-500">✓</span>
                                <span>Contextual help based on current modules</span>
                            </li>
                        </ul>
                    </div>
                    <div className="md:w-1/2">
                        <div className="relative bg-white rounded-xl shadow-xl p-4 max-w-md mx-auto">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-center mb-3">
                                    <div className="w-10 h-10 bg-blue-500 rounded-md"></div>
                                    <span className="ml-3 font-medium">Canvas Dashboard</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="bg-white p-2 rounded border border-gray-200">
                                        <div className="text-sm font-medium">CS 101: Introduction to Programming</div>
                                        <div className="text-xs text-gray-500">Assignment due: Friday, 11:59 PM</div>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-gray-200">
                                        <div className="text-sm font-medium">MATH 240: Linear Algebra</div>
                                        <div className="text-xs text-gray-500">Quiz scheduled: Thursday, 2:00 PM</div>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-center">
                                    <div className="animate-pulse flex space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    </div>
                                </div>
                                <div className="text-center text-xs mt-2">Syncing with AI Assistant...</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Multiple AI Models */}
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center">
                    <div className="md:w-1/2 mb-8 md:mb-0 md:pl-12">
                        <h3 className="text-2xl font-bold mb-4">Multiple AI Models</h3>
                        <p className="text-lg text-gray-600 mb-6">
                            Choose from industry-leading LLMs for your ideal learning experience.
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-center">
                                <span className="mr-2 text-green-500">✓</span>
                                <span>Customize your learning experience</span>
                            </li>
                            <li className="flex items-center">
                                <span className="mr-2 text-green-500">✓</span>
                                <span>Different strengths for different subjects</span>
                            </li>
                            <li className="flex items-center">
                                <span className="mr-2 text-green-500">✓</span>
                                <span>Always up-to-date with the latest models</span>
                            </li>
                        </ul>
                    </div>
                    <div className="md:w-1/2">
                        <div className="flex justify-center space-x-6">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shadow-md">
                                <span className="font-bold">OpenAI</span>
                            </div>
                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shadow-md">
                                <span className="font-bold">Claude</span>
                            </div>
                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shadow-md">
                                <span className="font-bold">Gemini</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="w-full py-16 px-6 md:px-12 bg-gray-900 text-white">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold">{testimonials[activeTestimonial].quote}</h2>
                        <p className="mt-4 text-gray-400">{testimonials[activeTestimonial].author}</p>
                    </div>

                    <div className="flex justify-center space-x-2">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveTestimonial(index)}
                                className={`w-3 h-3 rounded-full ${index === activeTestimonial ? 'bg-green-500' : 'bg-gray-600'}`}
                                aria-label={`Testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full py-12 px-6 md:px-12 bg-gray-900 text-white">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-lg font-bold mb-4">StudyAI</h3>
                        <p className="text-gray-400">Your AI-powered study companion.</p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Product</h4>
                        <ul className="space-y-2">
                            <li><Link href="#" className="text-gray-400 hover:text-white transition">Features</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition">Roadmap</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Resources</h4>
                        <ul className="space-y-2">
                            <li><Link href="#" className="text-gray-400 hover:text-white transition">Blog</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition">Documentation</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition">Guides</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Company</h4>
                        <ul className="space-y-2">
                            <li><Link href="#" className="text-gray-400 hover:text-white transition">About</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition">Careers</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white transition">Contact</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
                    <p>© {new Date().getFullYear()} StudyAI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
