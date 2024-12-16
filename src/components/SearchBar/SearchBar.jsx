import React, { useState } from 'react'

export default function SearchBar({data, setSearch}) {
  
    const findItem = (keyword) => {
      if (keyword.trim() === "") {
        setSearch(data); // If no keyword, reset to original data
      } else {
        const results = data.filter((item) =>
          item.content_title.toLowerCase().includes(keyword.toLowerCase()) // Adjust `item.name` to match your data structure
        );
        setSearch(results);
      }
    };
  

  return (
    <div>
      <input type='text' placeholder='Search By Content Name' onKeyUp={(e)=>findItem(e.target.value)} className='p-3 px-5 w-full rounded-md border border-purple-700'/>
    </div>
  )
}
