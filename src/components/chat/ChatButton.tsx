"use client"

import { ChatWidget } from "./ChatWidget"
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2"
import { motion, AnimatePresence } from "framer-motion"

export function ChatButton() {
  return (
    <ChatWidget
      trigger={
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-charcoal text-ivory rounded-full shadow-lg flex items-center justify-center hover:bg-charcoal/90 transition-colors"
          aria-label="Open chat"
        >
          <HiOutlineChatBubbleLeftRight className="w-6 h-6" />
        </motion.button>
      }
    />
  )
}
