import React, { useState, useLayoutEffect } from 'react';

export default function Wrapper({ title, children }) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  useLayoutEffect(() => {
    // TODO, we can make it following react code style when we clean up all of the examples
    const nav = document.querySelector('#root ul.nav');
    if (!nav) return;
    nav.style.display = isSidebarVisible ? null : 'none';
  }, [isSidebarVisible]);

  return (
    <div className="example">
      <h1 onClick={() => setIsSidebarVisible(!isSidebarVisible)}>
        <span>{isSidebarVisible}</span> {title}
      </h1>
      {children}
    </div>
  );
}
