import React, { useContext, useEffect, useState } from 'react'
import Inputtextbox from '../../components/inputtextbox/Inputtextbox'
import Uploadbutton from '../../components/uploadbutton/Uploadbutton'
import Submitbutton from '../../components/submitbutton/Submitbutton'
import { CREATE_CONTENT, GET_ALL_MIRRORS } from '../../serverRequests/ServerRequests'
import { LoadingStateContext } from '../../Contexts/LoadingStateContext'
import Loadinpage from '../loadingpage/Loadinpage'
import { useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'
import ImageCropperModal from '../../components/ImageCropperModal/ImageCropperModal'

export default function Addcontentpage() {
  const { getCookie, setCookie } = useContext(CookieContext)
  const { isLoading } = useContext(LoadingStateContext)
  const [contentTitle, setcontenttitle] = useState('')
  const [ContentDescription, setcontentdescription] = useState('')
  const [content, setcontent] = useState(null)
  const [originalContent, setOriginalContent] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [duration, setDuration] = useState(5)
  const [fileDimensions, setFileDimensions] = useState(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [videoFitMode, setVideoFitMode] = useState("cover") // "cover" or "contain"
  const [videoAlignment, setVideoAlignment] = useState("center center")
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
        setOriginalContent(file)
        const img = new Image()
        img.onload = () => {
          const dims = { width: img.naturalWidth, height: img.naturalHeight }
          setFileDimensions(dims)
          if (dims.width !== targetWidth || dims.height !== targetHeight) {
            setIsCropperOpen(true)
          }
        }
        img.src = fileUrl
      } else if (file.type.startsWith('video/')) {
        setOriginalContent(null)
        const vid = document.createElement('video')
        vid.onloadedmetadata = () => {
          setFileDimensions({ width: vid.videoWidth, height: vid.videoHeight })
        }
        vid.src = fileUrl
      } else {
        setOriginalContent(null)
        setFileDimensions(null)
      }
    }
  }

  const handleCropComplete = (croppedFile, newPreviewUrl, dims) => {
    setcontent(croppedFile)
    setPreviewUrl(newPreviewUrl)
    setFileDimensions(dims)
    setErrorMessage('')
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
    const isImage = content?.type.startsWith('image/')
    const isVideo = content?.type.startsWith('video/')

    if (isImage && fileDimensions && !isExactMatch) {
      setErrorMessage(`Uploaded image dimensions (${fileDimensions.width} × ${fileDimensions.height} px) do not match mirror resolution (${targetWidth} × ${targetHeight} px). Please use the image cropper.`)
      return
    }

    setIsSubmitting(true)
    setStatusText("Uploading media to mirror playlist...")
    setErrorMessage('')

    const uploadW = isVideo ? targetWidth : (fileDimensions ? fileDimensions.width : targetWidth)
    const uploadH = isVideo ? targetHeight : (fileDimensions ? fileDimensions.height : targetHeight)

    let login_key = getCookie('login_key') || 'adminpassword'
    CREATE_CONTENT(
      login_key,
      contentTitle.trim(),
      ContentDescription.trim(),
      content,
      selectedMirrorId,
      duration,
      uploadW,
      uploadH
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
              <div className='mt-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3'>
                {content?.type.startsWith('image/') ? (
                  <div className='flex items-center gap-3'>
                    <img src={previewUrl} alt="Preview" className='w-16 h-16 object-cover rounded-lg border border-neutral-200' />
                    <div className='text-xs'>
                      <p className='font-bold text-neutral-800'>{content?.name}</p>
                      <p className='text-neutral-500'>{(content?.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                ) : (
                  /* Video Output Preview shaped to mirror dimensions (Portrait / Landscape) */
                  <div className="w-full flex flex-col items-center gap-2.5">
                    <div className="flex items-center justify-between w-full max-w-sm px-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-bold text-black">
                          {isPortrait ? "Portrait Video Crop Preview" : "Video Screen Output Preview"}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                        {targetWidth} × {targetHeight} px
                      </span>
                    </div>

                    {/* Simulated Display Screen Bezel matching mirror aspect ratio */}
                    <div
                      className="relative rounded-2xl overflow-hidden bg-black border-4 border-neutral-900 shadow-xl flex items-center justify-center transition-all duration-200"
                      style={
                        isPortrait
                          ? {
                              height: "320px",
                              width: `${Math.max(140, Math.round(320 * (targetWidth / targetHeight)))}px`,
                              maxWidth: "100%",
                            }
                          : {
                              width: "100%",
                              maxWidth: "380px",
                              aspectRatio: `${targetWidth} / ${targetHeight}`,
                              maxHeight: "220px",
                            }
                      }
                    >
                      {/* Display Top Bezel Chin */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-neutral-800 rounded-full z-20 pointer-events-none opacity-60" />

                      {/* Video Element Cropped into Screen Dimensions */}
                      <video
                        src={previewUrl}
                        controls
                        autoPlay
                        muted
                        loop
                        playsInline
                        className={`w-full h-full ${
                          videoFitMode === "contain" ? "object-contain" : "object-cover"
                        } bg-black block`}
                        style={{
                          objectPosition: videoAlignment,
                        }}
                      />

                      {/* Live Crop Badge Overlay */}
                      <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-xs text-white text-[9px] font-mono px-2 py-1 rounded-md z-20 flex items-center justify-between pointer-events-none border border-white/10">
                        <span className="truncate">
                          {videoFitMode === "contain" ? "Letterbox Fit" : (isPortrait ? "Portrait Cropped" : "Full Screen Crop")}
                        </span>
                        <span className="shrink-0">{targetWidth} × {targetHeight}</span>
                      </div>
                    </div>

                    {/* Video Crop Controls: Crop to Fill vs Letterbox Fit & Positioning */}
                    <div className="flex items-center justify-center gap-2 flex-wrap text-xs pt-0.5">
                      <div className="inline-flex rounded-lg bg-neutral-100 p-0.5 border border-neutral-200">
                        <button
                          type="button"
                          onClick={() => setVideoFitMode("cover")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                            videoFitMode === "cover"
                              ? "bg-black text-white shadow-2xs"
                              : "text-neutral-600 hover:text-black"
                          }`}
                        >
                          Crop to Fill {isPortrait ? "Portrait" : "Screen"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoFitMode("contain")}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                            videoFitMode === "contain"
                              ? "bg-black text-white shadow-2xs"
                              : "text-neutral-600 hover:text-black"
                          }`}
                        >
                          Fit (Letterbox)
                        </button>
                      </div>

                      {videoFitMode === "cover" && (
                        <div className="inline-flex rounded-lg bg-neutral-100 p-0.5 border border-neutral-200">
                          {isPortrait ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setVideoAlignment("left center")}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                  videoAlignment === "left center"
                                    ? "bg-white text-black shadow-2xs font-bold"
                                    : "text-neutral-500 hover:text-black"
                                }`}
                                title="Align video crop to left side"
                              >
                                Left
                              </button>
                              <button
                                type="button"
                                onClick={() => setVideoAlignment("center center")}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                  videoAlignment === "center center"
                                    ? "bg-white text-black shadow-2xs font-bold"
                                    : "text-neutral-500 hover:text-black"
                                }`}
                                title="Align video crop to center"
                              >
                                Center
                              </button>
                              <button
                                type="button"
                                onClick={() => setVideoAlignment("right center")}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                  videoAlignment === "right center"
                                    ? "bg-white text-black shadow-2xs font-bold"
                                    : "text-neutral-500 hover:text-black"
                                }`}
                                title="Align video crop to right side"
                              >
                                Right
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setVideoAlignment("center top")}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                  videoAlignment === "center top"
                                    ? "bg-white text-black shadow-2xs font-bold"
                                    : "text-neutral-500 hover:text-black"
                                }`}
                                title="Align video crop to top"
                              >
                                Top
                              </button>
                              <button
                                type="button"
                                onClick={() => setVideoAlignment("center center")}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                  videoAlignment === "center center"
                                    ? "bg-white text-black shadow-2xs font-bold"
                                    : "text-neutral-500 hover:text-black"
                                }`}
                                title="Align video crop to center"
                              >
                                Center
                              </button>
                              <button
                                type="button"
                                onClick={() => setVideoAlignment("center bottom")}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                                  videoAlignment === "center bottom"
                                    ? "bg-white text-black shadow-2xs font-bold"
                                    : "text-neutral-500 hover:text-black"
                                }`}
                                title="Align video crop to bottom"
                              >
                                Bottom
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {content?.type.startsWith('image/') ? (
                  fileDimensions && (
                    isExactMatch ? (
                      <div className='w-full flex items-center justify-between gap-2 flex-wrap bg-emerald-50 border border-emerald-300 rounded-xl p-2.5'>
                        <div className='text-xs font-semibold text-emerald-800 flex items-center gap-1.5'>
                          <span>✓ Verified: {fileDimensions.width} × {fileDimensions.height} px matches mirror dimensions</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCropperOpen(true)}
                          className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-black border border-neutral-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Adjust Crop
                        </button>
                      </div>
                    ) : (
                      <div className='w-full p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-left space-y-2'>
                        <div className='flex items-center justify-between gap-2 flex-wrap'>
                          <div className='text-xs font-bold text-amber-900'>
                            Resolution Mismatch ({fileDimensions.width} × {fileDimensions.height} px)
                          </div>
                          <span className='text-[10px] font-mono text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded font-bold'>
                            Target: {targetWidth} × {targetHeight} px
                          </span>
                        </div>
                        <p className='text-[11px] text-amber-800 leading-normal'>
                          This mirror requires images sized at <strong>{targetWidth} × {targetHeight} px</strong>. Crop this image to fit the mirror screen.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsCropperOpen(true)}
                          className='w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs'
                        >
                          <svg className='w-4 h-4 text-emerald-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                          </svg>
                          <span>Crop Image to Mirror Size ({targetWidth} × {targetHeight} px)</span>
                        </button>
                      </div>
                    )
                  )
                ) : (
                  /* Video Output Ready Banner */
                  <div className="w-full p-3 rounded-2xl bg-neutral-900 text-white border border-neutral-800 text-left flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <div className="text-xs space-y-0.5 flex-1 min-w-0">
                      <div className="font-bold text-white flex items-center justify-between gap-2 flex-wrap">
                        <span>Video Output Ready</span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                          Auto Fit • No Crop Needed
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-normal">
                        Videos stream natively in their original aspect ratio and automatically scale to fit the <strong>{targetWidth} × {targetHeight} px</strong> display.
                      </p>
                    </div>
                  </div>
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
                text={isSubmitting ? "Uploading..." : (fileDimensions && !isExactMatch && content?.type.startsWith('image/') ? "Crop Image" : (content?.type.startsWith('video/') ? "Add Video to Mirror" : "Add to Mirror"))}
                disabled={!content || isSubmitting || (fileDimensions && !isExactMatch && content?.type.startsWith('image/'))}
                onClick={fileDimensions && !isExactMatch && content?.type.startsWith('image/') ? (e) => { e.preventDefault(); setIsCropperOpen(true); } : undefined}
              />
            </div>
          </div>
        </form>
      )}

      {/* Interactive Image Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageFile={originalContent || content}
        targetWidth={targetWidth}
        targetHeight={targetHeight}
        onCropComplete={handleCropComplete}
      />
    </>
  )
}
