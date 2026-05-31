"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AdminErrorBoundary caught:", error.message, error.stack)
    console.error("Component stack:", info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 m-4">
          <h2 className="text-lg font-bold text-red-800 mb-2">Admin Render Error</h2>
          <p className="text-sm text-red-700 mb-2">{this.state.error.message}</p>
          <pre className="text-xs text-red-600 overflow-auto max-h-96 whitespace-pre-wrap">{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
