import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ViewDetailsMeeting from "../../../../components/LeadingIndicator/Hs-Meetings/Hs-MeetingsDetails/ViewDetailsMeeting";
import { getActivityById } from "../../../../services/HsActivityService";
import { errorNotification } from "../../../../utility/NotificationUtility";

/**
 * Fiche réunion en consultation directe (LOT 49) : la route
 * hs-Meetings/viewDetails-meeting/:id montait le composant sans données,
 * la page restait figée sur « Chargement… ». Le wrapper charge désormais
 * l'activité depuis l'identifiant de l'URL.
 */
const ViewDetailsMeetingPage = () => {
    const { id } = useParams();
    const [activity, setActivity] = useState<any>(null);

    useEffect(() => {
        if (!id) return;
        getActivityById(id)
            .then((res) => setActivity(res))
            .catch((err) => {
                errorNotification(err.response?.data?.errorMessage || "La réunion n'a pas pu être chargée");
            });
    }, [id]);

    return (
        <div className="p-5"><ViewDetailsMeeting activity={activity} /></div>
    );
};

export default ViewDetailsMeetingPage;
