import { useState, useEffect } from "react"

export default function OTPModal({ onVerify, email }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [timeLeft, setTimeLeft] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true)
      return
    }

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft])

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto-focus to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerify = () => {
    setIsVerifying(true)
    const otpCode = otp.join("")
    setTimeout(() => {
      onVerify(otpCode)
      setIsVerifying(false)
    }, 1000)
  }

  const handleResend = () => {
    setTimeLeft(60)
    setCanResend(false)
    setOtp(["", "", "", "", "", ""])
    console.log("OTP resent to", email)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{
      background: 'linear-gradient(135deg, #ffd4d4 0%, #ffb8be 50%, #ff9aa2 100%)'
    }}>
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl shadow-2xl p-8"
          style={{
            background: 'linear-gradient(to bottom, #ffe8e8, #fff0f0)',
            border: '1px solid rgba(255, 130, 130, 0.3)'
          }}
        >
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)'
              }}
            >
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#b91c1c' }}>
              Verify Your Code
            </h1>
            <p className="text-base" style={{ color: '#dc2626' }}>
              We sent a 6-digit code to
            </p>
            <p className="text-sm font-semibold mt-1" style={{ color: '#ff5757' }}>
              {email}
            </p>
          </div>

          <div className="mb-8">
            <div className="flex gap-3 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength={1}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none"
                  style={{
                    background: '#fff5f5',
                    borderColor: '#fca5a5',
                    color: '#b91c1c'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#ff5757')}
                  onBlur={(e) => (e.target.style.borderColor = '#fca5a5')}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={otp.join("").length !== 6 || isVerifying}
            className="w-full py-3.5 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            style={{
              background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)',
              color: '#ffffff'
            }}
          >
            {isVerifying ? "Verifying..." : "Verify Code"}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#fca5a5' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 text-sm" style={{ 
                background: 'linear-gradient(to bottom, #ffe8e8, #fff0f0)',
                color: '#dc2626'
              }}>
                Didn't receive the code?
              </span>
            </div>
          </div>

          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-base font-bold transition-colors hover:opacity-80"
                style={{ color: '#ff5757' }}
              >
                Resend Code
              </button>
            ) : (
              <p className="text-base font-semibold" style={{ color: '#dc2626' }}>
                Resend in <span style={{ color: '#ff5757' }}>{timeLeft}s</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}