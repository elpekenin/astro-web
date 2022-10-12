import { Menu, Transition } from "@headlessui/react";
import Icon from '@mdi/react';
import { mdiHome, mdiPokemonGo } from '@mdi/js';

let aClassName = (active) => `${active && "bg-palette-select text-white"} block w-full text-left px-4 py-2 text-sm cursor-pointer`;

const NavMenu = () => {
  return (
    <div className="flex items-center px-4 py-3">
        <a href="/"><Icon path={mdiHome} size={1.3} /></a>
        
        <nav className="align-center">
            <ul className="flex lg:space-x-5 lg:ml-14">
                <li>
                <Menu>
                    <Menu.Button className="hover:text-palette-text ">
                    <span className="inline-block"><Icon path={mdiPokemonGo} size={0.8} className="flex"/></span> Pokemon GO 
                    </Menu.Button>
                    <Transition
                        enter="transition duration-100 ease-out"
                        enterFrom="transform scale-95 opacity-0"
                        enterTo="transform scale-100 opacity-100"
                        leave="transition duration-75 ease-out"
                        leaveFrom="transform scale-100 opacity-100"
                        leaveTo="transform scale-95 opacity-0"
                    >
                    <Menu.Items className="absolute left-0 mt-4 w-max py-3 rounded-md bg-palette-main focus:outline-none">
                        <Menu.Item>
                        {({ active }) => (
                            <a
                                className={aClassName(active)}
                                href="/pokemon-sites/"
                            >
                            Páginas útiles
                            </a>
                        )}
                        </Menu.Item>
                        <Menu.Item>
                        {({ active }) => (
                            <a
                                className={aClassName(active)}
                                href="/pokemon-posts"
                            >
                            Mis posts
                            </a>
                        )}
                        </Menu.Item>
                        <Menu.Item>
                        {({ active }) => (
                            <a
                                className={aClassName(active)}
                                href="/40dex"
                            >
                            40dex
                            </a>
                        )}
                        </Menu.Item>
                    </Menu.Items>
                    </Transition>
                </Menu>
                </li>
            </ul>
        </nav>
    </div>
  );
};

export default NavMenu;