import { Tabs } from '@mantine/core';
import { IconBook } from '@tabler/icons-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Lesson from '../IncidentManagement/Details/Lesson';



const LessonDetails = () => {
    const { id } = useParams();
    // Bug corrigé : l'onglet actif initial ('expired') ne correspondait à aucun onglet déclaré
    const [activeTab, setActiveTab] = useState('lesson');
    const incidentId = Number(id);




    const tabData = {


        lesson: {
            label: 'Leçon apprise',
            icon: IconBook,
            content: <Lesson
                incidentId={incidentId}


            />,
        },

    };
    return (
        <div className=" space-y-6" >





            <div className="p-4">
                <Tabs
                    value={activeTab}
                    onChange={(value) => value && setActiveTab(value)}
                    classNames={{ tab: 'hover:underline hover:text-blue-600' }}
                >
                    <Tabs.List className='!flex !gap-6'>
                        {Object.entries(tabData).map(([key, { label, icon: Icon }]) => (
                            <Tabs.Tab key={key} value={key} leftSection={<Icon size={25} />} className="!text-lg !!text-gray-600 ">
                                {label}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>

                    {Object.entries(tabData).map(([key, { content }]) => (
                        <Tabs.Panel value={key} key={key} pt="md">


                            <div className="p-2">{content}</div>


                        </Tabs.Panel>
                    ))}
                </Tabs>
            </div>



        </div >
    )
}

export default LessonDetails