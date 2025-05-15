"use client"

import React from 'react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const Header = () => {
  return (
    <div className="bg-black w-full border-b border-white/5 py-4 px-4 items-center justify-between flex space-x-2">
      {/* logo */}
      <Link href="dashboard" prefetch className="link text-white text-lg">
        Imagery<b className="text-yellow-400 font-mono pl-1">_</b>
      </Link>
      {/* dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex space-x-2 items-center justify-center">
            <img className="rounded-full h-6 w-6 self-center" src="/placeholder-avatar.jpg" />
            <p className="label text-white">User Name</p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-black text-white border-white/10">
          <Link href={"/dashboard"}>
            <DropdownMenuItem className="dropmenu_item">dashboard</DropdownMenuItem>
          </Link>
          <Link href={"/usage"}>
            <DropdownMenuItem className="dropmenu_item">usage</DropdownMenuItem>
          </Link>
          <Link href={"/plans"}>
            <DropdownMenuItem className="dropmenu_item">plans</DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem className="dropmenu_item">logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Header