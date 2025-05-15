"use client"
import Header from "../(_components)/Header"
const page = () => {
  return (
    <div className="bg-black min-h-screen w-full items-center justify-start flex flex-col">
        <Header />
      <div className="w-full items-center justify-end py-4 flex px-6 mt-4">
        <button className="text-white/80 text-md smooth hover:text-white">
          + new canvas
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 w-full py-12 px-6 gap-6 lg:w-[90%]">
        {/* Canvas items will be mapped here */}
      </div>
    </div>
  )
}

export default page