import React, { useContext, useEffect, useState } from 'react'
import Inputtextbox from '../../components/inputtextbox/Inputtextbox'
import Uploadbutton from '../../components/uploadbutton/Uploadbutton'
import Submitbutton from '../../components/submitbutton/Submitbutton'
import { CREATE_CONTENT, GET_ALL_MIRRORS } from '../../serverRequests/ServerRequests'
import { LoadingStateContext } from '../../Contexts/LoadingStateContext'
import Loadinpage from '../loadingpage/Loadinpage'
import { useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'

export default function Addcontentpage() {
  const { getCookie, setCookie } = useContext(CookieContext)
  const { isLoading } = useContext(LoadingStateContext)
  const [contentTitle, setcontenttitle] = useState('')
  const [ContentDescription, setcontentdescription] = useState('')
  const [content, setcontent] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [duration, setDuration] = useState(5)
  const [fileDimensions, setFileDimensions] = useState(null)
  const [mirrors, setMirrors] = useState([])
  const [selectedMirrorId, setSelectedMirrorId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusText, setStatusText] = useState('')
  let navigate = useNavigate()

  useEffect(() => {
    let login_key = getCookie('login_key') || 'adminpassword'
    GET_ALL_MIRRORS(login_key)
      .then((res) => {
        const mirrorList = res?.data || []
        setMirrors(mirrorList)
        const cookieMirrorId = getCookie('mirror_id')
        if (cookieMirrorId && mirrorList.some((m) => String(m._id) === String(cookieMirrorId))) {
          setSelectedMirrorId(cookieMirrorId)
        } else if (mirrorList.length > 0) {
          setSelectedMirrorId(mirrorList[0]._id)
        }
      })
      .catch((err) => {
        console.error("Error loading mirrors:", err)
      })
  }, [])

  const selectedMirror = mirrors.find((m) => String(m._id) === String(selectedMirrorId))
  const targetWidth = Number(selectedMirror?.mirror_width) || 1920
  const targetHeight = Number(selectedMirror?.mirror_height) || 1080
  const isPortrait = targetHeight > targetWidth
  const orientationText = isPortrait ? 'Portrait (Vertical)' : (targetWidth === targetHeight ? 'Square' : 'Landscape (Horizontal)')

  const HandleFile = (e) => {
    const file = e.target.files && e.target.files[0]
    if (file) {
      setcontent(file)
      setErrorMessage('')

      if (!contentTitle) {
        const base = file.name.replace(/\.[^/.]+$/, "")
        setcontenttitle(base)
      }

      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)

      if (file.type.startsWith('image/')) {
        const img = new Image()
        img.onload = () => {
          setFileDimensions({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.src = fileUrl
      } else if (file.type.startsWith('video/')) {
        const vid = document.createElement('video')
        vid.onloadedmetadata = () => {
          setFileDimensions({ width: vid.videoWidth, height: vid.videoHeight })
        }
        vid.src = fileUrl
      } else {
        setFileDimensions(null)
      }
    }
  }

  const isExactMatch = fileDimensions && fileDimensions.width === targetWidth && fileDimensions.height === targetHeight

  const HandleSubmit = (e) => {
    e.preventDefault()
    if (!contentTitle.trim()) {
      setErrorMessage('Content Title is required.')
      return
    }
    if (!content) {
      setErrorMessage('Please choose or drop an image or video file to upload.')
      return
    }
    if (!selectedMirrorId) {
      setErrorMessage('Please select a mirror for this content.')
      return
    }
    if (fileDimensions && !isExactMatch) {
      setErrorMessage(`Uploaded media dimensions (${fileDimensions.width} × ${fileDimensions.height} px) do not match mirror resolution (${targetWidth} × ${targetHeight} px). Uploaded contents must match mirror dimensions.`)
      return
    }

    setIsSubmitting(true)
    setStatusText("Uploading media to mirror playlist...")
    setErrorMessage('')

    let login_key = getCookie('login_key') || 'adminpassword'
    CREATE_CONTENT(
      login_key,
      contentTitle.trim(),
      ContentDescription.trim(),
      content,
      selectedMirrorId,
      duration,
      fileDimensions ? fileDimensions.width : null,
      fileDimensions ? fileDimensions.height : null
    )
      .then(() => {
        setCookie('mirror_id', selectedMirrorId)
        setStatusText("Upload complete! Redirecting to mirror setup...")
        setTimeout(() => {
          navigate('/contentlist')
        }, 600)
      })
      .catch((err) => {
        console.error("Upload error:", err)
        setErrorMessage("Upload failed. Supported formats: MP4, JPG, PNG, WEBP.")
        setStatusText('')
        setIsSubmitting(false)
      })
  }

  return (
    <>
      {isLoading ? (
        <Loadinpage />
      ) : (
        <form onSubmit={HandleSubmit} className='p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-xs border border-slate-200/80 my-2 sm:my-4 space-y-6'>
          <div>
            <h2 className='text-lg sm:text-xl font-bold text-slate-800 tracking-tight'>Add Content to Mirror</h2>
            <p className='text-xs text-slate-500 mt-1'>
              Upload images or videos directly to a specific mirror's dedicated playlist.
            </p>
          </div>

          {/* Mirror Target Dropdown */}
          {mirrors.length > 0 && (
            <div>
              <label className='block text-xs font-bold text-black mb-1.5'>
                Target Mirror <span className='text-red-500'>*</span>
              </label>
              <select
                value={selectedMirrorId}
                onChange={(e) => setSelectedMirrorId(e.target.value)}
                className='w-full px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 focus:border-black rounded-xl text-xs font-semibold text-black outline-none transition-colors cursor-pointer'
              >
                {mirrors.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.mirror_name} ({m.mirror_width || 1920} × {m.mirror_height || 1080})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mirror Resolution Warning Banner */}
          <div className='p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-3'>
            <div className='w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
              </svg>
            </div>
            <div className='text-xs space-y-1'>
              <div className='font-bold text-amber-950 flex items-center gap-1.5 flex-wrap'>
                <span>Display Resolution Warning:</span>
                <span className='font-mono bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded-md font-bold text-[11px]'>
                  {targetWidth} × {targetHeight} px
                </span>
                <span className='text-[11px] font-medium text-amber-800'>({orientationText})</span>
              </div>
              <p className='text-amber-900/80 leading-relaxed text-[11px]'>
                Please upload media formatted in this mirror's native resolution (<strong>{targetWidth} × {targetHeight}</strong>). Media with different dimensions will be scaled to fit and may display letterbox borders or stretching.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className='p-4 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200'>
              {errorMessage}
            </div>
          )}

          {statusText && (
            <div className='p-4 rounded-xl text-xs font-semibold bg-neutral-100 text-black border border-neutral-300 flex items-center gap-2'>
              <div className='w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin'></div>
              <span>{statusText}</span>
            </div>
          )}

          <div className='space-y-4'>
            <Inputtextbox
              label='Content Title'
              description='Descriptive name for this media slide'
              placeholder='e.g., Summer Promotional Banner 2026'
              value={contentTitle}
              updatedata={setcontenttitle}
              required={true}
            />
            <Inputtextbox
              label='Content Description'
              description='Optional notes or scheduling details'
              placeholder='e.g., Featured on entrance display'
              value={ContentDescription}
              updatedata={setcontentdescription}
              required={false}
            />
          </div>

          {/* Duration Selector for Images */}
          {(!content || !content.type.startsWith('video/')) && (
            <div>
              <label className='block text-xs font-bold text-black mb-1.5'>
                Time to Stay on Screen
              </label>
              <div className='flex items-center gap-2'>
                <div className='inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium'>
                  <svg className='w-3.5 h-3.5 text-neutral-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  <span className='text-neutral-500'>Time to stay:</span>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className='bg-transparent font-bold text-black outline-none cursor-pointer pr-1'
                  >
                    <option value={2}>2s (Fast)</option>
                    <option value={3}>3s</option>
                    <option value={4}>4s</option>
                    <option value={5}>5s (Default)</option>
                    <option value={7}>7s</option>
                    <option value={8}>8s</option>
                    <option value={10}>10s</option>
                    <option value={15}>15s</option>
                    <option value={20}>20s</option>
                    <option value={30}>30s</option>
                    <option value={45}>45s</option>
                    <option value={60}>60s</option>
                  </select>
                </div>
                <span className='text-[11px] text-neutral-400'>
                  Duration this slide stays on screen before advancing
                </span>
              </div>
            </div>
          )}

          {/* Upload Zone */}
          <div className='space-y-2 pt-2'>
            <label className='text-sm font-semibold text-slate-800'>
              Media File <span className='text-red-500 font-bold'>*</span>
            </label>
            <Uploadbutton label='Upload File' update={HandleFile} accept='.mp4,.jpg,.jpeg,.png,.webp,.gif' />

            {/* Thumbnail Preview with Resolution Comparison */}
            {previewUrl && (
              <div className='mt-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between gap-3 flex-wrap'>
                <div className='flex items-center gap-3'>
                  {content?.type.startsWith('image/') ? (
                    <img src={previewUrl} alt="Preview" className='w-16 h-16 object-cover rounded-lg border border-neutral-200' />
                  ) : (
                    <div className='w-16 h-16 rounded-lg bg-black text-white flex items-center justify-center'>
                      <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' />
                      </svg>
                    </div>
                  )}
                  <div className='text-xs'>
                    <p className='font-bold text-neutral-800'>{content?.name}</p>
                    <p className='text-neutral-500'>{(content?.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>

                {fileDimensions && (
                  isExactMatch ? (
                    <div className='px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300'>
                      <span>✓ Resolution Match: {fileDimensions.width} × {fileDimensions.height} px matches mirror dimensions</span>
                    </div>
                  ) : (
                    <div className='w-full p-3 rounded-xl bg-red-50 border border-red-200 text-left space-y-1'>
                      <div className='text-xs font-bold text-red-800'>Resolution Mismatch — Upload Blocked</div>
                      <p className='text-[11px] text-red-700'>
                        Uploaded media is <strong className='font-mono'>{fileDimensions.width} × {fileDimensions.height} px</strong>, but this mirror requires exactly <strong className='font-mono'>{targetWidth} × {targetHeight} px</strong>.
                      </p>
                      <p className='text-[11px] text-red-600 font-medium'>
                        Please upload media matching mirror dimensions ({targetWidth} × {targetHeight} px).
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className='pt-6 border-t border-slate-100 flex items-center justify-end gap-3'>
            <button
              type='button'
              onClick={() => navigate(-1)}
              className='px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer'
            >
              Cancel
            </button>
            <div className='w-48'>
              <Submitbutton
                text={isSubmitting ? "Uploading..." : (fileDimensions && !isExactMatch ? "Resolution Mismatch" : "Add to Mirror")}
                disabled={!content || isSubmitting || (fileDimensions && !isExactMatch)}
              />
            </div>
          </div>
        </form>
      )}
    </>
  )
}
