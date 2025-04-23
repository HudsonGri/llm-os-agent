'use client'
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Space_Grotesk } from 'next/font/google'
import { MessageCircle } from 'lucide-react'
import TypingHeader from './components/TypingHeader'
import './components/styles.css'
import './styles.css'
import { ChatLogo } from "@/components/ui/chat-logo"
import FeatureCards from "./components/FeatureCards"
// Initialize the font
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700']
})

export default function Home() {
  // Function to get a random rotation between -3 and 3 degrees
  const getRandomRotation = () => {
    return Math.random() * 3 - 1; // Random value between -3 and 3
  };

  // Materials for the typing header
  const materials = [
    'Syllabus',
    'Lecture Notes',
    'Course Slides',
    'Lecture Videos',
    'Course Projects',
    'Course Assignments',
    'Course Discussions',
    'Course Quizzes',
  ];

  return (
    <main className={`min-h-screen bg-black text-white ${spaceGrotesk.className}`}>
      {/* Logo section with glassmorphism effect */}
      <a href="/" className="fixed top-6 left-6 flex items-center gap-2 px-4 py-2 bg-zinc-900/50 backdrop-blur-md rounded-full border border-zinc-800/50 shadow-lg z-20 hover:bg-zinc-900/70 transition-colors">
        <ChatLogo className="w-7 h-7 text-blue-500" />
        <span className="font-semibold text-lg">donno.ai</span>
      </a>
      
      <div className="container mx-auto px-4 py-8">


        {/* Main Content */}
        <div className="flex flex-col md:flex-row items-center justify-between py-16 gap-8">
          {/* Left Column */}
          <div className="w-full md:w-1/2 space-y-8">
            <TypingHeader 
              prefix="AI That Speaks Your"
              materials={materials}
              className="text-5xl md:text-6xl leading-tight"
            />

            <p className="text-xl text-zinc-400 max-w-lg">
              Transform your learning experience with AI that understands your course materials.
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-7 text-xl rounded-lg flex items-center gap-3 font-semibold"
              onClick={() => window.location.href = '/'}
            >
              <MessageCircle className="w-6 h-6" />
              Chat Now
            </Button>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-12">
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-zinc-400">Resources</span>
                </div>
                <p className="text-4xl font-bold">200+</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-zinc-400">Updates</span>
                </div>
                <p className="text-4xl font-bold">Daily</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-zinc-400">Available</span>
                </div>
                <p className="text-4xl font-bold">24/7</p>
              </div>
            </div>
            
            {/* Integrations */}
            <div className="pt-12">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-2xl text-zinc-400 font-medium">Integrates with</h3>
                <div className="h-12 w-40 relative">
                  <div 
                    className="absolute inset-0 bg-zinc-300" 
                    style={{ 
                      WebkitMaskImage: `url('/imgs/Canvas_logo.png')`,
                      maskImage: `url('/imgs/Canvas_logo.png')`,
                      WebkitMaskSize: 'contain',
                      maskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      maskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskPosition: 'center'
                    }}
                  ></div>
                </div>
              </div>
              
              <p className="text-zinc-400">
                Powered by LLMs from{" "}
                <span className="font-medium text-zinc-300">OpenAI</span>,{" "}
                <span className="font-medium text-zinc-300">Google</span>, and{" "}
                <span className="font-medium text-zinc-300">Anthropic</span>
              </p>
            </div>
          </div>

          {/* Right Column - Glowing Logo with Text Background */}
          <div className="w-full md:w-1/2 relative h-[650px]">
            {/* Text Chunks Background */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-3 opacity-40">
              {Array.from({ length: 16 }).map((_, i) => {
                const rotation = getRandomRotation();
                return (
                  <div 
                    key={i} 
                    className="group relative bg-gradient-to-br from-zinc-800 to-zinc-900 p-3 text-xs overflow-hidden rounded-lg 
                             shadow-lg hover:shadow-xl transition-all duration-300 hover:opacity-100 hover:scale-105
                             border border-zinc-700/50 hover:border-blue-500/30 pulse-animation border-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <p className="relative text-zinc-300 group-hover:text-zinc-100 transition-colors duration-300">
                      {getTextChunk(i)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Glowing Logo */}
            <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-2xl flex items-center justify-center z-10 floating-logo">
              {/* Blue glow effect */}
              <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-3xl opacity-40"></div>

              {/* Logo image */}
              <div className="relative z-10 w-80 h-80">
                <Image
                  src="/imgs/glow-logo.png"
                  alt="AI Logo"
                  width={512}
                  height={512}
                  className="rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
        <FeatureCards />
      </div>
    </main>
  )
}

function getTextChunk(index: number) {
  const textChunks = [
    "Chapter 1: Introduction to Machine Learning. The field of machine learning focuses on algorithms that can learn from data without being explicitly programmed. These algorithms build models based on sample data, known as training data, in order to make predictions or decisions without being explicitly programmed to do so. Machine learning algorithms are used in a wide variety of applications, such as email filtering and computer vision...",
    "1.2 Supervised Learning: In supervised learning, the algorithm learns from labeled training data, and makes predictions based on that data. Each example in the training dataset is a pair consisting of an input object and a desired output value. The algorithm analyzes the training data and produces an inferred function, which can be used for mapping new examples. Supervised learning algorithms include linear regression, logistic regression, support vector machines, and neural networks...",
    "Neural networks are composed of layers of interconnected nodes, mimicking the structure of the human brain. Each connection can transmit a signal from one node to another. The receiving node processes the signal and then signals downstream nodes connected to it. Typically, nodes are aggregated into layers, with different layers performing different transformations on their inputs. Signals travel from the first layer (input), through hidden layers, to the last layer (output)...",
    "The backpropagation algorithm calculates the gradient of the loss function with respect to the weights of the network. It is commonly used to train deep neural networks, updating the weights to minimize the loss function. The algorithm efficiently computes these gradients using the chain rule, iterating backwards from the output layer to avoid redundant calculations of intermediate terms in the chain rule. This makes training deep networks computationally feasible...",
    "Chapter 2: Natural Language Processing. NLP is a field of AI that gives machines the ability to read, understand, and derive meaning from human languages. It combines computational linguistics—rule-based modeling of human language—with statistical, machine learning, and deep learning models. NLP tasks include sentiment analysis, text classification, machine translation, question answering, and text generation...",
    "Transformers have revolutionized NLP tasks through their attention mechanisms and parallel processing capabilities. Unlike recurrent neural networks, transformers process all words in a sentence simultaneously, allowing for more efficient training on larger datasets. The self-attention mechanism enables the model to weigh the importance of different words in a sentence when encoding each word, capturing long-range dependencies more effectively than previous architectures...",
    "2.3 Word Embeddings: Word embeddings are a type of word representation that allows words with similar meaning to have similar representation. They are learned representations where words that have the same meaning have a similar representation. They are a distributed representation for text that is perhaps one of the key breakthroughs for the impressive performance of deep learning methods on challenging NLP problems...",
    "The BERT model introduced bidirectional training of Transformer, allowing it to learn from both left and right context in all layers. This bidirectional approach provides a deeper sense of language context compared to single-direction language models. BERT is pre-trained on a large corpus of unlabeled text including the entire Wikipedia and Book Corpus, and can be fine-tuned with just one additional output layer to create state-of-the-art models for a wide range of NLP tasks...",
    "Chapter 3: Computer Vision. Computer vision is an interdisciplinary field that deals with how computers can gain high-level understanding from digital images or videos. It seeks to automate tasks that the human visual system can do. Computer vision tasks include image classification, object detection, image segmentation, facial recognition, and scene reconstruction. The field has made significant advances with the adoption of deep learning techniques...",
    "Convolutional Neural Networks (CNNs) have proven highly effective for image classification, object detection, and other vision tasks. CNNs use a variation of multilayer perceptrons designed to require minimal preprocessing. They consist of convolutional layers that apply convolution operations to the input, passing the result to the next layer. This architecture allows CNNs to automatically and adaptively learn spatial hierarchies of features from input images...",
    "3.2 Image Segmentation: Image segmentation is the process of partitioning a digital image into multiple segments to simplify representation. The goal is to change the representation of an image into something more meaningful and easier to analyze. Image segmentation is typically used to locate objects and boundaries in images. Techniques include thresholding, clustering methods, compression-based methods, and neural network approaches like U-Net and Mask R-CNN...",
    "Transfer learning allows models trained on large datasets to be fine-tuned for specific tasks with smaller datasets. In computer vision, pre-trained models like ResNet, VGG, and Inception have been trained on massive datasets like ImageNet. These models have learned general features that are useful for many vision tasks. By using these pre-trained models as a starting point, researchers can achieve state-of-the-art results on specific tasks with limited training data...",
    "Chapter 4: Reinforcement Learning. Reinforcement learning is an area of machine learning concerned with how software agents ought to take actions in an environment to maximize some notion of cumulative reward. The agent learns by interacting with its environment and observing the results of these interactions. This paradigm of learning by trial-and-error, solely from rewards or punishments, differs from supervised learning in that correct input/output pairs need not be presented...",
    "The Q-learning algorithm learns the value of an action in a particular state, without requiring a model of the environment. It works by learning an action-value function that gives the expected utility of taking a given action in a given state and following a fixed policy thereafter. The strength of Q-learning is that it can compare the expected utility of available actions without requiring a model of the environment. It can handle problems with stochastic transitions and rewards...",
    "4.3 Policy Gradients: Policy gradient methods optimize the policy directly, rather than maintaining a separate value function. These methods work by computing an estimator of the policy gradient and using it to update the policy parameters in the direction of greater cumulative reward. One advantage of policy gradient methods is that they can learn stochastic policies, which can be useful in partially observable environments. Popular algorithms include REINFORCE, Proximal Policy Optimization (PPO), and Trust Region Policy Optimization (TRPO)...",
    "Deep reinforcement learning combines neural networks with reinforcement learning principles to solve complex decision-making tasks. This approach has led to breakthroughs in various domains, including playing Atari games, defeating world champions at Go and poker, and controlling robotic systems. Deep RL algorithms like Deep Q-Networks (DQN), Asynchronous Advantage Actor-Critic (A3C), and Soft Actor-Critic (SAC) have pushed the boundaries of what machines can learn to do through interaction with their environment...",
  ]

  return textChunks[index % textChunks.length]
}

// Function to calculate delay based on spiral pattern
function getSpiralDelay(index: number): number {
  // Map from index to position in 4x4 grid
  const col = index % 4;
  const row = Math.floor(index / 4);
  
  // Calculate distance from center (1.5, 1.5) in 4x4 grid
  const centerX = 1.5;
  const centerY = 1.5;
  const distX = Math.abs(col - centerX);
  const distY = Math.abs(row - centerY);
  
  // Calculate ring number from center (0 = center, 1 = first ring, etc.)
  const ringNumber = Math.max(distX, distY);
  
  // Calculate position within the ring
  let position;
  if (col >= centerX && row < centerY) {
    // Top right quadrant
    position = row;
  } else if (col >= centerX && row >= centerY) {
    // Bottom right quadrant
    position = 2 + (row - centerY);
  } else if (col < centerX && row >= centerY) {
    // Bottom left quadrant
    position = 4 + (centerX - col);
  } else {
    // Top left quadrant
    position = 6 + (centerY - row);
  }
  
  // Calculate final delay - smaller rings start first
  // Base delay of 0.2s per position in spiral
  return ringNumber * 0.5 + position * 0.2;
}
