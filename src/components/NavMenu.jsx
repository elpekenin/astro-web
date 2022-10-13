import { Menu, Transition } from "@headlessui/react";

const NavMenu = () => {
  return (
    <div className="flex items-center px-4 py-3">
            <ul className="flex lg:space-x-5 lg:ml-14">
                <li>
                <Menu>
                    <Menu.Button className="hover:text-links">
                    Pokémon GO 
                    </Menu.Button>
                    <Transition
                        enter="transition duration-100 ease-out"
                        enterFrom="transform scale-95 opacity-0"
                        enterTo="transform scale-100 opacity-100"
                        leave="transition duration-75 ease-out"
                        leaveFrom="transform scale-100 opacity-100"
                        leaveTo="transform scale-95 opacity-0"
                    >
                    <Menu.Items className="absolute left-0 mt-4 w-max py-3 rounded-md bg-palette1 focus:outline-none">
                        <Menu.Item>
                        {({ active }) => (
                            <a
                            className={ `${active && "bg-palette3 text-palette4" } block w-full text-left px-4 py-2 text-sm cursor-pointer` }
                            href="/pokemon-sites/index.html"
                            >
                            Páginas útiles
                            </a>
                        )}
                        </Menu.Item>
                        <Menu.Item>
                        {({ active }) => (
                            <a
                            className={ `${active && "bg-palette3 text-palette4" } block w-full text-left px-4 py-2 text-sm cursor-pointer` }
                            href="/pokemon-posts/index.html"
                            >
                            Mis posts
                            </a>
                        )}
                        </Menu.Item>
                        <Menu.Item>
                        {({ active }) => (
                            <a
                            className={ `${active && "bg-palette3 text-palette4" } block w-full text-left px-4 py-2 text-sm cursor-pointer` }
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
    </div>
  );
};

export default NavMenu;