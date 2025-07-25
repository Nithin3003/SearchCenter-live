import React from 'react';
import { Github, Linkedin, Mail, Search, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 15 }}
                className="mr-2"
              >
                <Search className="h-6 w-6 text-blue-600" />
              </motion.div>
              <span className="text-xl font-bold">SearchCenter</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">
              Find code snippets, projects, and documentation to accelerate your development process.
            </p>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} SearchCenter. All rights reserved.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Navigation</h3>
            <div className="flex flex-col space-y-2">
              <Link to="/" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Home</Link>
              <Link to="/explore" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Explore</Link>
              <Link to="/community" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Community</Link>
              <Link to="/feedback" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">Feedback</Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">About</Link>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Connect</h3>
            <div className="flex space-x-4">
              <motion.a 
                whileHover={{ y: -3 }}
                href="https://github.com/msnithin84" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Github className="h-5 w-5" />
              </motion.a>
              <motion.a 
                whileHover={{ y: -3 }}
                href="https://www.linkedin.com/in/nithin-ms-365958256/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </motion.a>
              <motion.a 
                whileHover={{ y: -3 }}
                href="mailto:msnithin84@gmail.com" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </motion.a>
            </div>
            
            <div className="pt-4">
              <motion.a
                whileHover={{ scale: 1.05 }}
                href="mailto:commamedia@comma.media"
                className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 transition-colors"
              >
                Contact Us <Mail className="ml-2 h-4 w-4" />
              </motion.a>
            </div>
            
            <div className="text-sm text-gray-500 flex items-center mt-4">
              Made with <Heart className="h-3 w-3 mx-1 text-red-500" /> by Nithin
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;