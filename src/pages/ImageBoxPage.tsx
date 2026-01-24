import ImageBox from '@/components/ImageBox'

const ImageBoxPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
          Image Box Demo
        </h1>
        <div className="flex justify-center">
          <ImageBox 
            initialTitle=""
            initialImageSrc=""
            initialMarks={[]}
          />
        </div>
      </div>
    </div>
  )
}

export default ImageBoxPage
