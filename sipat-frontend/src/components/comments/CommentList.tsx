import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Exported types for strict TypeScript checking across your app
export interface CommentType {
  id: string;
  author: {
    name: string;
    isAnonymous: boolean;
  };
  content: string;
  timestamp: string;
  upvotes: number;
  replies?: CommentType[];
}

export interface CommentListProps {
  comments: CommentType[];
}

// Internal recursive component for individual comments and their replies
const CommentItem: React.FC<{ comment: CommentType; isReply?: boolean }> = ({
  comment,
  isReply = false,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.upvotes);
  const [showReplyBox, setShowReplyBox] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  return (
    <div className={`flex flex-col ${isReply ? "mt-4" : "mt-6"}`}>
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-1 relative">
          {comment.author.isAnonymous ? (
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-bold text-sm">
              {comment.author.name.charAt(0)}
            </div>
          )}
          {/* Thread Connector Line (only shows if there are replies) */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="absolute top-12 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-full" />
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col gap-1.5 pb-2">
          {/* Header */}
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {comment.author.isAnonymous
                ? "Anonymous Citizen"
                : comment.author.name}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {comment.timestamp}
            </span>
          </div>

          {/* Text */}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                isLiked
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill={isLiked ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              {likesCount}
            </button>

            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              Reply
            </button>
          </div>

          {/* Inline Reply Box (Mock UI) */}
          <AnimatePresence>
            {showReplyBox && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    className="flex-1 px-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <button
                    onClick={() => setShowReplyBox(false)}
                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Reply
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Render Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-5 ml-5 border-l-2 border-slate-100 dark:border-slate-800/80">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );
};

// Main List Wrapper
export default function CommentList({ comments }: CommentListProps) {
  if (!comments || comments.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 dark:text-slate-400">
        <svg
          className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-sm font-medium">No verifications or comments yet.</p>
        <p className="text-xs mt-1">
          Be the first to provide feedback on this commit.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
        Community Feedback
        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
          {comments.length}
        </span>
      </h3>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
