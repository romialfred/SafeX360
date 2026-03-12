import { IconPoint } from "@tabler/icons-react";
import ArticlesCard from "./ArticlesCard";
import { Button } from "@mantine/core";

import article1 from '@/assets/img/Layout/article1.jpg';
import article2 from '@/assets/img/Layout/article2.jpg';
import article3 from '@/assets/img/Layout/article3.jpg';
import mainImage from '@/assets/img/Layout/articles.jpg';
const articles = [
    {
        id: 1,
        name: "Manufacturing",
        date: "Jan 28, 2025",
        feedback: "5 Key Strategies for Efficient Industrial Operation",
        image: article1,  // Use imported image
    },
    {
        id: 2,
        name: "Industrial",
        date: "Jan 23, 2025",
        feedback: "Exploring the Future of Aerospace: What Lies Ahead?",
        image: article2,
    },
    {
        id: 3,
        name: "Manufacturing",
        date: "Feb 8, 2025",
        feedback: "Boosting Manufacturing Efficiency with Innovation",
        image: article3,
    },
];

const Articles = () => {
    return (
        <div className="flex gap-10 p-10">
            <div className="flex flex-col gap-10 w-1/2 p-2">
                <div className="flex flex-col gap-3">
                    <p className="text-2xl font-medium text-primary">Recent Reads</p>
                    <p className="text-4xl font-medium">Articles & blog posts with useful information</p>
                </div>
                <div className="flex flex-col gap-6 bg-gray-100 p-8  shadow-md">
                    <div>
                        <img src={mainImage} alt="" className="w-full rounded-md" />
                    </div>
                    <div className="flex gap-2 items-center text-gray-700">
                        <p className="text-xl font-medium ">Manufacturing</p>
                        <IconPoint stroke={2} />
                        <p className="text-xl text-gray-500">Jan 28, 2025</p>
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold leading-tight">Top Manufacturing Trends Shaping Industry’s Future</h1>
                    </div>
                    <div>
                        <p className="text-xl text-gray-500">Explore the latest trends transforming manufacturing and how businesses can adapt for success.</p>
                    </div>
                </div>
            </div>

            <div className="p-10  w-1/2 flex flex-col gap-20 ">
                <div className="flex justify-end">
                    <Button className="text-primary font-medium">View All Articles</Button>
                </div>

                <div className="flex flex-col gap-10">
                    {articles.map((article: any) => (
                        <div key={article.id} className="bg-gray-100 p-8  shadow-lg hover:shadow-xl transition-all duration-300">
                            <ArticlesCard {...article} />
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default Articles;
